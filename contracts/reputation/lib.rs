//! # Polagon Score — soulbound reputation
//!
//! A non-transferable, append-only ledger of prediction outcomes per `AccountId`.
//! Only a configured `market_authority` (the `prediction_market` contract) can
//! write outcomes. Anyone can read.
//!
//! ## Score formula (v1)
//!
//!   score = correct_predictions * 100
//!         + (total_won_in_pot / 10^12)              // 1 POT won → +1 point
//!         + 2^min(consecutive_correct, 5)            // streak bonus, capped at 32
//!
//! v2 will switch to Brier-score weighting when the polls layer ships.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod reputation {
    use ink::storage::Mapping;

    /// Conversion: 10^12 base units = 1 POT (Substrate default decimals).
    const POT_DECIMALS_FACTOR: Balance = 1_000_000_000_000;

    #[derive(Debug, Clone, Default, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct ReputationStats {
        pub total_predictions: u64,
        pub correct_predictions: u64,
        pub total_staked: Balance,
        pub total_won: Balance,
        pub current_streak: u32,
        pub best_streak: u32,
        pub last_active: Timestamp,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        NotOwner,
        NotMarketAuthority,
        ZeroAddress,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(event)]
    pub struct OutcomeRecorded {
        #[ink(topic)]
        pub user: AccountId,
        pub market_id: u64,
        pub won: bool,
        pub stake: Balance,
        pub payout: Balance,
        pub new_score: u64,
    }

    #[ink(event)]
    pub struct AuthorityUpdated {
        #[ink(topic)]
        pub previous: Option<AccountId>,
        #[ink(topic)]
        pub current: AccountId,
    }

    #[ink(storage)]
    pub struct PolagonScore {
        owner: AccountId,
        market_authority: Option<AccountId>,
        stats: Mapping<AccountId, ReputationStats>,
    }

    impl PolagonScore {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                market_authority: None,
                stats: Mapping::default(),
            }
        }

        // ---------- Admin ----------

        #[ink(message)]
        pub fn set_market_authority(&mut self, authority: AccountId) -> Result<()> {
            self.only_owner()?;
            let prev = self.market_authority;
            self.market_authority = Some(authority);
            self.env().emit_event(AuthorityUpdated {
                previous: prev,
                current: authority,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            self.only_owner()?;
            self.owner = new_owner;
            Ok(())
        }

        // ---------- Writes (authority-gated) ----------

        /// Recorded by the market contract on `claim`. Pull-model: each user pays
        /// their own gas to register their outcome, no on-chain enumeration.
        #[ink(message)]
        pub fn record_outcome(
            &mut self,
            user: AccountId,
            market_id: u64,
            won: bool,
            stake: Balance,
            payout: Balance,
        ) -> Result<u64> {
            self.only_authority()?;

            let mut s = self.stats.get(user).unwrap_or_default();
            s.total_predictions = s.total_predictions.saturating_add(1);
            s.total_staked = s.total_staked.saturating_add(stake);
            if won {
                s.correct_predictions = s.correct_predictions.saturating_add(1);
                s.total_won = s.total_won.saturating_add(payout);
                s.current_streak = s.current_streak.saturating_add(1);
                if s.current_streak > s.best_streak {
                    s.best_streak = s.current_streak;
                }
            } else {
                s.current_streak = 0;
            }
            s.last_active = self.env().block_timestamp();
            self.stats.insert(user, &s);

            let new_score = self.score_from(&s);
            self.env().emit_event(OutcomeRecorded {
                user,
                market_id,
                won,
                stake,
                payout,
                new_score,
            });
            Ok(new_score)
        }

        // ---------- Reads ----------

        #[ink(message)]
        pub fn score_of(&self, user: AccountId) -> u64 {
            let s = self.stats.get(user).unwrap_or_default();
            self.score_from(&s)
        }

        #[ink(message)]
        pub fn stats_of(&self, user: AccountId) -> ReputationStats {
            self.stats.get(user).unwrap_or_default()
        }

        #[ink(message)]
        pub fn accuracy_bps(&self, user: AccountId) -> u32 {
            let s = self.stats.get(user).unwrap_or_default();
            if s.total_predictions == 0 {
                return 0;
            }
            ((s.correct_predictions as u128 * 10_000u128) / s.total_predictions as u128) as u32
        }

        #[ink(message)]
        pub fn get_authority(&self) -> Option<AccountId> {
            self.market_authority
        }

        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        // ---------- Internals ----------

        fn only_owner(&self) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            Ok(())
        }

        fn only_authority(&self) -> Result<()> {
            match self.market_authority {
                Some(a) if a == self.env().caller() => Ok(()),
                _ => Err(Error::NotMarketAuthority),
            }
        }

        fn score_from(&self, s: &ReputationStats) -> u64 {
            let correct_part = s.correct_predictions.saturating_mul(100);
            let won_part = (s.total_won / POT_DECIMALS_FACTOR) as u64;
            let streak = core::cmp::min(s.current_streak, 5);
            let streak_part: u64 = 1u64 << streak; // 2^streak, capped at 32
            correct_part
                .saturating_add(won_part)
                .saturating_add(streak_part)
        }
    }

    impl Default for PolagonScore {
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
        fn set_caller(c: AccountId) {
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(c);
        }

        #[ink::test]
        fn only_authority_can_record() {
            set_caller(alice());
            let mut s = PolagonScore::new();
            // No authority set yet.
            assert_eq!(
                s.record_outcome(bob(), 0, true, 100, 198),
                Err(Error::NotMarketAuthority)
            );
            // Set authority to alice.
            s.set_market_authority(alice()).unwrap();
            // Now alice (still caller) can record.
            let new_score = s.record_outcome(bob(), 0, true, 100, 198).unwrap();
            assert!(new_score >= 100);
            // Bob can't.
            set_caller(bob());
            assert_eq!(
                s.record_outcome(bob(), 0, true, 100, 198),
                Err(Error::NotMarketAuthority)
            );
        }

        #[ink::test]
        fn streak_resets_on_loss() {
            set_caller(alice());
            let mut s = PolagonScore::new();
            s.set_market_authority(alice()).unwrap();
            s.record_outcome(bob(), 0, true, 100, 200).unwrap();
            s.record_outcome(bob(), 1, true, 100, 200).unwrap();
            assert_eq!(s.stats_of(bob()).current_streak, 2);
            s.record_outcome(bob(), 2, false, 100, 0).unwrap();
            assert_eq!(s.stats_of(bob()).current_streak, 0);
            assert_eq!(s.stats_of(bob()).best_streak, 2);
        }

        #[ink::test]
        fn accuracy_bps_correct() {
            set_caller(alice());
            let mut s = PolagonScore::new();
            s.set_market_authority(alice()).unwrap();
            s.record_outcome(bob(), 0, true, 100, 200).unwrap();
            s.record_outcome(bob(), 1, false, 100, 0).unwrap();
            // 1/2 = 50% = 5000 bps
            assert_eq!(s.accuracy_bps(bob()), 5000);
        }

        #[ink::test]
        fn empty_user_zero_everything() {
            let s = PolagonScore::new();
            assert_eq!(s.score_of(bob()), 1); // 2^0 = 1 from streak floor
            assert_eq!(s.accuracy_bps(bob()), 0);
            assert_eq!(s.stats_of(bob()).total_predictions, 0);
        }
    }
}
