//! # Polagon Polls
//!
//! Lightweight on-chain community polls. Differs from `prediction_market`:
//!   * No money — no stake, no payout, no fee.
//!   * Anyone can create a poll (gas only).
//!   * One vote per address per poll. Vote is mutable until the poll closes.
//!   * 2 to 8 options (binary YES/NO is just `["Yes", "No"]`).
//!
//! ## v1 weighting
//! v1 records each vote with **weight 1**. The frontend can compute reputation-
//! weighted tallies by reading per-voter scores from the `reputation` contract.
//!
//! v2 will perform the cross-contract score lookup at vote-time and store a
//! snapshot, so the on-chain tally is itself reputation-weighted. The storage
//! layout reserves `weighted_votes_per_option` to make that swap forward-
//! compatible.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod polls {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    const MAX_QUESTION_LEN: usize = 280;
    const MAX_OPTION_LEN: usize = 80;
    const MIN_OPTIONS: usize = 2;
    const MAX_OPTIONS: usize = 8;

    #[derive(Debug, PartialEq, Eq, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum PollStatus {
        Open,
        Closed,
    }

    #[derive(Debug, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Poll {
        pub id: u64,
        pub question: String,
        pub options: Vec<String>,
        pub creator: AccountId,
        pub end_time: Timestamp,
        pub votes_per_option: Vec<u64>,
        pub total_voters: u64,
        pub status: PollStatus,
        pub created_at: Timestamp,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        NotOwner,
        NotCreator,
        PollNotFound,
        PollClosed,
        PollExpired,
        PollNotExpired,
        InvalidOptionIndex,
        TooFewOptions,
        TooManyOptions,
        QuestionEmpty,
        QuestionTooLong,
        OptionTooLong,
        EndTimeInPast,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    // ---------- Events ----------

    #[ink(event)]
    pub struct PollCreated {
        #[ink(topic)]
        pub id: u64,
        #[ink(topic)]
        pub creator: AccountId,
        pub end_time: Timestamp,
        pub option_count: u32,
    }

    #[ink(event)]
    pub struct Voted {
        #[ink(topic)]
        pub poll_id: u64,
        #[ink(topic)]
        pub voter: AccountId,
        pub option_index: u32,
        pub previous_index: Option<u32>,
    }

    #[ink(event)]
    pub struct PollClosed {
        #[ink(topic)]
        pub poll_id: u64,
        #[ink(topic)]
        pub closed_by: AccountId,
    }

    // ---------- Storage ----------

    #[ink(storage)]
    pub struct Polls {
        owner: AccountId,
        next_poll_id: u64,
        polls: Mapping<u64, Poll>,
        /// (poll_id, voter) → option_index
        votes: Mapping<(u64, AccountId), u32>,
        /// Optional Reputation contract address — reserved for v2 weighting.
        reputation: Option<AccountId>,
    }

    impl Polls {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                next_poll_id: 0,
                polls: Mapping::default(),
                votes: Mapping::default(),
                reputation: None,
            }
        }

        // ---------- Admin ----------

        #[ink(message)]
        pub fn set_reputation(&mut self, addr: AccountId) -> Result<()> {
            self.only_owner()?;
            self.reputation = Some(addr);
            Ok(())
        }

        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            self.only_owner()?;
            self.owner = new_owner;
            Ok(())
        }

        // ---------- Poll lifecycle ----------

        #[ink(message)]
        pub fn create_poll(
            &mut self,
            question: String,
            options: Vec<String>,
            end_time: Timestamp,
        ) -> Result<u64> {
            if question.is_empty() {
                return Err(Error::QuestionEmpty);
            }
            if question.len() > MAX_QUESTION_LEN {
                return Err(Error::QuestionTooLong);
            }
            if options.len() < MIN_OPTIONS {
                return Err(Error::TooFewOptions);
            }
            if options.len() > MAX_OPTIONS {
                return Err(Error::TooManyOptions);
            }
            for opt in &options {
                if opt.len() > MAX_OPTION_LEN {
                    return Err(Error::OptionTooLong);
                }
            }
            let now = self.env().block_timestamp();
            if end_time <= now {
                return Err(Error::EndTimeInPast);
            }

            let id = self.next_poll_id;
            self.next_poll_id = id.saturating_add(1);

            let votes_per_option = (0..options.len()).map(|_| 0u64).collect();
            let poll = Poll {
                id,
                question,
                options: options.clone(),
                creator: self.env().caller(),
                end_time,
                votes_per_option,
                total_voters: 0,
                status: PollStatus::Open,
                created_at: now,
            };
            self.polls.insert(id, &poll);

            self.env().emit_event(PollCreated {
                id,
                creator: poll.creator,
                end_time,
                option_count: options.len() as u32,
            });
            Ok(id)
        }

        /// Cast or change a vote. The poll must be open and not expired.
        #[ink(message)]
        pub fn vote(&mut self, poll_id: u64, option_index: u32) -> Result<()> {
            let mut poll = self.polls.get(poll_id).ok_or(Error::PollNotFound)?;
            if poll.status != PollStatus::Open {
                return Err(Error::PollClosed);
            }
            let now = self.env().block_timestamp();
            if now >= poll.end_time {
                return Err(Error::PollExpired);
            }
            if option_index as usize >= poll.options.len() {
                return Err(Error::InvalidOptionIndex);
            }

            let caller = self.env().caller();
            let key = (poll_id, caller);
            let previous = self.votes.get(key);

            // Apply vote (weight 1 in v1).
            if let Some(prev_idx) = previous {
                if prev_idx == option_index {
                    return Ok(()); // no-op, idempotent
                }
                // Decrement previous tally.
                let cur = poll.votes_per_option[prev_idx as usize];
                poll.votes_per_option[prev_idx as usize] = cur.saturating_sub(1);
            } else {
                poll.total_voters = poll.total_voters.saturating_add(1);
            }
            poll.votes_per_option[option_index as usize] = poll
                .votes_per_option[option_index as usize]
                .saturating_add(1);
            self.votes.insert(key, &option_index);
            self.polls.insert(poll_id, &poll);

            self.env().emit_event(Voted {
                poll_id,
                voter: caller,
                option_index,
                previous_index: previous,
            });
            Ok(())
        }

        /// Close a poll early (creator) or after expiry (anyone).
        #[ink(message)]
        pub fn close(&mut self, poll_id: u64) -> Result<()> {
            let mut poll = self.polls.get(poll_id).ok_or(Error::PollNotFound)?;
            if poll.status == PollStatus::Closed {
                return Ok(());
            }
            let now = self.env().block_timestamp();
            let caller = self.env().caller();
            let is_creator = caller == poll.creator;
            if !is_creator && now < poll.end_time {
                return Err(Error::PollNotExpired);
            }
            poll.status = PollStatus::Closed;
            self.polls.insert(poll_id, &poll);
            self.env().emit_event(PollClosed {
                poll_id,
                closed_by: caller,
            });
            Ok(())
        }

        // ---------- Reads ----------

        #[ink(message)]
        pub fn get_poll(&self, id: u64) -> Option<Poll> {
            self.polls.get(id)
        }

        #[ink(message)]
        pub fn get_poll_count(&self) -> u64 {
            self.next_poll_id
        }

        #[ink(message)]
        pub fn list_polls(&self, start: u64, limit: u64) -> Vec<Poll> {
            let mut out = Vec::new();
            let end = start.saturating_add(limit).min(self.next_poll_id);
            let mut i = start;
            while i < end {
                if let Some(p) = self.polls.get(i) {
                    out.push(p);
                }
                i = i.saturating_add(1);
            }
            out
        }

        #[ink(message)]
        pub fn get_my_vote(&self, poll_id: u64, who: AccountId) -> Option<u32> {
            self.votes.get((poll_id, who))
        }

        #[ink(message)]
        pub fn get_config(&self) -> (AccountId, Option<AccountId>) {
            (self.owner, self.reputation)
        }

        // ---------- Internals ----------

        fn only_owner(&self) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            Ok(())
        }
    }

    impl Default for Polls {
        fn default() -> Self {
            Self::new()
        }
    }

    // ---------- Tests ----------

    #[cfg(test)]
    mod tests {
        use super::*;

        fn alice() -> AccountId {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().alice
        }
        fn bob() -> AccountId {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().bob
        }
        fn charlie() -> AccountId {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().charlie
        }
        fn set_caller(c: AccountId) {
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(c);
        }
        fn set_block_timestamp(t: Timestamp) {
            ink::env::test::set_block_timestamp::<ink::env::DefaultEnvironment>(t);
        }

        fn fresh() -> Polls {
            set_caller(alice());
            Polls::new()
        }

        fn opts() -> Vec<String> {
            ["Yes".into(), "No".into()].to_vec()
        }

        #[ink::test]
        fn create_and_vote_and_change() {
            let mut c = fresh();
            set_block_timestamp(0);
            let id = c.create_poll("Approve?".into(), opts(), 1_000).unwrap();

            set_caller(bob());
            c.vote(id, 0).unwrap();
            assert_eq!(c.get_my_vote(id, bob()), Some(0));
            let p = c.get_poll(id).unwrap();
            assert_eq!(p.votes_per_option, vec![1, 0]);
            assert_eq!(p.total_voters, 1);

            // Change vote.
            c.vote(id, 1).unwrap();
            assert_eq!(c.get_my_vote(id, bob()), Some(1));
            let p = c.get_poll(id).unwrap();
            assert_eq!(p.votes_per_option, vec![0, 1]);
            assert_eq!(p.total_voters, 1); // still 1 unique voter

            // Idempotent: voting same option again.
            c.vote(id, 1).unwrap();
            let p = c.get_poll(id).unwrap();
            assert_eq!(p.votes_per_option, vec![0, 1]);
        }

        #[ink::test]
        fn cannot_vote_after_expiry() {
            let mut c = fresh();
            set_block_timestamp(0);
            let id = c.create_poll("Approve?".into(), opts(), 1_000).unwrap();
            set_block_timestamp(1_500);
            set_caller(bob());
            assert_eq!(c.vote(id, 0), Err(Error::PollExpired));
        }

        #[ink::test]
        fn invalid_option_index_blocked() {
            let mut c = fresh();
            set_block_timestamp(0);
            let id = c.create_poll("Approve?".into(), opts(), 1_000).unwrap();
            set_caller(bob());
            assert_eq!(c.vote(id, 5), Err(Error::InvalidOptionIndex));
        }

        #[ink::test]
        fn close_after_expiry_anyone() {
            let mut c = fresh();
            set_block_timestamp(0);
            let id = c.create_poll("Approve?".into(), opts(), 1_000).unwrap();
            set_block_timestamp(2_000);
            set_caller(charlie()); // not creator
            c.close(id).unwrap();
            let p = c.get_poll(id).unwrap();
            assert_eq!(p.status, PollStatus::Closed);
        }

        #[ink::test]
        fn close_before_expiry_only_creator() {
            let mut c = fresh();
            set_block_timestamp(0);
            let id = c.create_poll("Approve?".into(), opts(), 1_000).unwrap();
            set_block_timestamp(500);
            set_caller(bob());
            assert_eq!(c.close(id), Err(Error::PollNotExpired));
            // Creator can.
            set_caller(alice());
            c.close(id).unwrap();
        }

        #[ink::test]
        fn create_validates_inputs() {
            let mut c = fresh();
            set_block_timestamp(100);
            assert_eq!(
                c.create_poll("".into(), opts(), 1_000),
                Err(Error::QuestionEmpty),
            );
            assert_eq!(
                c.create_poll("q".into(), vec!["only".into()], 1_000),
                Err(Error::TooFewOptions),
            );
            let too_many: Vec<String> = (0..9).map(|i| format!("opt {i}").into()).collect();
            assert_eq!(
                c.create_poll("q".into(), too_many, 1_000),
                Err(Error::TooManyOptions),
            );
            assert_eq!(
                c.create_poll("q".into(), opts(), 50),
                Err(Error::EndTimeInPast),
            );
        }
    }
}
