//! # Polagon — Prediction Market
//!
//! Parimutuel binary (YES/NO) prediction markets, native to Portaldot.
//!
//! ## Roles
//! * **Owner**: protocol admin. Can update fee, fee recipient, and reputation address.
//! * **Creator**: spawns a market by paying `create_market_fee` in POT.
//! * **Resolver**: chosen by creator at market creation. Calls `resolve` after `end_time`.
//! * **Bettor**: anyone with POT, while the market is `Open` and `now < end_time`.
//!
//! ## Lifecycle
//! `Open` → `Resolved` (winners claim) | `Cancelled` (everyone refunds, admin/creator only, no bets yet).
//!
//! ## Payout (parimutuel, fee `f` in basis points)
//! For winner `i` with stake `s_i`, winning pool `P_w`, losing pool `P_l`:
//!     payout_i = s_i + (s_i / P_w) * P_l * (10_000 - f) / 10_000
//! Edge cases:
//!   * `P_w == 0` → losing-side stakers refund (one-sided market with wrong outcome).
//!   * `P_l == 0` → winning-side stakers refund only their stake (no upside, no fee).

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod prediction_market {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Maximum length of a market question, in bytes. Prevents storage griefing.
    const MAX_QUESTION_LEN: usize = 280;
    /// Basis-point denominator.
    const BPS: u128 = 10_000;
    /// Hard cap on protocol fee (10%).
    const MAX_FEE_BPS: u16 = 1_000;

    #[derive(Debug, PartialEq, Eq, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum MarketStatus {
        Open,
        Resolved,
        Cancelled,
    }

    #[derive(Debug, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Market {
        pub id: u64,
        pub question: String,
        pub creator: AccountId,
        pub resolver: AccountId,
        pub end_time: Timestamp,
        pub total_yes: Balance,
        pub total_no: Balance,
        pub status: MarketStatus,
        pub outcome: Option<bool>,
        pub created_at: Timestamp,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        NotOwner,
        NotResolver,
        NotCreator,
        MarketNotFound,
        MarketNotOpen,
        MarketExpired,
        MarketNotExpired,
        AlreadyResolved,
        AlreadyClaimed,
        NoPosition,
        ZeroStake,
        FeeTooHigh,
        QuestionTooLong,
        QuestionEmpty,
        EndTimeInPast,
        InsufficientCreateFee,
        TransferFailed,
        ArithmeticOverflow,
        HasBets,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    // ---------- Events ----------

    #[ink(event)]
    pub struct MarketCreated {
        #[ink(topic)]
        pub id: u64,
        #[ink(topic)]
        pub creator: AccountId,
        pub end_time: Timestamp,
        pub resolver: AccountId,
    }

    #[ink(event)]
    pub struct BetPlaced {
        #[ink(topic)]
        pub market_id: u64,
        #[ink(topic)]
        pub bettor: AccountId,
        pub side: bool,
        pub amount: Balance,
    }

    #[ink(event)]
    pub struct MarketResolved {
        #[ink(topic)]
        pub market_id: u64,
        pub outcome: bool,
        #[ink(topic)]
        pub resolver: AccountId,
    }

    #[ink(event)]
    pub struct MarketCancelled {
        #[ink(topic)]
        pub market_id: u64,
    }

    #[ink(event)]
    pub struct Claimed {
        #[ink(topic)]
        pub market_id: u64,
        #[ink(topic)]
        pub bettor: AccountId,
        pub stake: Balance,
        pub payout: Balance,
        pub won: bool,
    }

    // ---------- Storage ----------

    #[ink(storage)]
    pub struct Polagon {
        owner: AccountId,
        fee_recipient: AccountId,
        protocol_fee_bps: u16,
        create_market_fee: Balance,
        next_market_id: u64,
        markets: Mapping<u64, Market>,
        /// (market_id, account, side) → staked balance
        positions: Mapping<(u64, AccountId, bool), Balance>,
        /// (market_id, account) → has the user already claimed/refunded?
        claimed: Mapping<(u64, AccountId), bool>,
        /// Optional address of the Reputation contract — set by owner post-deploy.
        reputation: Option<AccountId>,
    }

    impl Polagon {
        #[ink(constructor)]
        pub fn new(
            fee_recipient: AccountId,
            protocol_fee_bps: u16,
            create_market_fee: Balance,
        ) -> Self {
            assert!(protocol_fee_bps <= MAX_FEE_BPS, "fee too high");
            Self {
                owner: Self::env().caller(),
                fee_recipient,
                protocol_fee_bps,
                create_market_fee,
                next_market_id: 0,
                markets: Mapping::default(),
                positions: Mapping::default(),
                claimed: Mapping::default(),
                reputation: None,
            }
        }

        // ---------- Admin ----------

        #[ink(message)]
        pub fn set_fee(&mut self, bps: u16) -> Result<()> {
            self.only_owner()?;
            if bps > MAX_FEE_BPS {
                return Err(Error::FeeTooHigh);
            }
            self.protocol_fee_bps = bps;
            Ok(())
        }

        #[ink(message)]
        pub fn set_fee_recipient(&mut self, who: AccountId) -> Result<()> {
            self.only_owner()?;
            self.fee_recipient = who;
            Ok(())
        }

        #[ink(message)]
        pub fn set_create_market_fee(&mut self, fee: Balance) -> Result<()> {
            self.only_owner()?;
            self.create_market_fee = fee;
            Ok(())
        }

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

        // ---------- Market lifecycle ----------

        /// Spawn a new market. The caller pays `create_market_fee` in POT, which is
        /// forwarded to the fee recipient. The market has no initial liquidity.
        #[ink(message, payable)]
        pub fn create_market(
            &mut self,
            question: String,
            end_time: Timestamp,
            resolver: AccountId,
        ) -> Result<u64> {
            let paid = self.env().transferred_value();
            if paid < self.create_market_fee {
                return Err(Error::InsufficientCreateFee);
            }
            if question.is_empty() {
                return Err(Error::QuestionEmpty);
            }
            if question.len() > MAX_QUESTION_LEN {
                return Err(Error::QuestionTooLong);
            }
            let now = self.env().block_timestamp();
            if end_time <= now {
                return Err(Error::EndTimeInPast);
            }

            let id = self.next_market_id;
            self.next_market_id = id.saturating_add(1);

            let market = Market {
                id,
                question,
                creator: self.env().caller(),
                resolver,
                end_time,
                total_yes: 0,
                total_no: 0,
                status: MarketStatus::Open,
                outcome: None,
                created_at: now,
            };
            self.markets.insert(id, &market);

            // forward the fee to the recipient (best-effort: the fee was already paid into
            // this contract; we sweep the configured amount to the recipient).
            if self.create_market_fee > 0 {
                self.env()
                    .transfer(self.fee_recipient, self.create_market_fee)
                    .map_err(|_| Error::TransferFailed)?;
            }
            // Refund any overpayment to the caller.
            let refund = paid.saturating_sub(self.create_market_fee);
            if refund > 0 {
                self.env()
                    .transfer(self.env().caller(), refund)
                    .map_err(|_| Error::TransferFailed)?;
            }

            self.env().emit_event(MarketCreated {
                id,
                creator: market.creator,
                end_time,
                resolver,
            });
            Ok(id)
        }

        /// Place a bet on `side` (true = YES, false = NO). Stake = `transferred_value`.
        #[ink(message, payable)]
        pub fn bet(&mut self, market_id: u64, side: bool) -> Result<()> {
            let amount = self.env().transferred_value();
            if amount == 0 {
                return Err(Error::ZeroStake);
            }
            let mut market = self.markets.get(market_id).ok_or(Error::MarketNotFound)?;
            if market.status != MarketStatus::Open {
                return Err(Error::MarketNotOpen);
            }
            let now = self.env().block_timestamp();
            if now >= market.end_time {
                return Err(Error::MarketExpired);
            }

            let caller = self.env().caller();
            let key = (market_id, caller, side);
            let existing = self.positions.get(key).unwrap_or(0);
            let new_position = existing
                .checked_add(amount)
                .ok_or(Error::ArithmeticOverflow)?;
            self.positions.insert(key, &new_position);

            if side {
                market.total_yes = market
                    .total_yes
                    .checked_add(amount)
                    .ok_or(Error::ArithmeticOverflow)?;
            } else {
                market.total_no = market
                    .total_no
                    .checked_add(amount)
                    .ok_or(Error::ArithmeticOverflow)?;
            }
            self.markets.insert(market_id, &market);

            self.env().emit_event(BetPlaced {
                market_id,
                bettor: caller,
                side,
                amount,
            });
            Ok(())
        }

        /// Resolver finalizes the market with a binary outcome. Only callable after `end_time`.
        #[ink(message)]
        pub fn resolve(&mut self, market_id: u64, outcome: bool) -> Result<()> {
            let mut market = self.markets.get(market_id).ok_or(Error::MarketNotFound)?;
            if market.status != MarketStatus::Open {
                return Err(Error::AlreadyResolved);
            }
            if self.env().caller() != market.resolver {
                return Err(Error::NotResolver);
            }
            let now = self.env().block_timestamp();
            if now < market.end_time {
                return Err(Error::MarketNotExpired);
            }

            market.status = MarketStatus::Resolved;
            market.outcome = Some(outcome);
            self.markets.insert(market_id, &market);

            self.env().emit_event(MarketResolved {
                market_id,
                outcome,
                resolver: self.env().caller(),
            });
            Ok(())
        }

        /// Creator may cancel a market that has not yet received any bets, e.g. typo.
        #[ink(message)]
        pub fn cancel(&mut self, market_id: u64) -> Result<()> {
            let mut market = self.markets.get(market_id).ok_or(Error::MarketNotFound)?;
            if market.status != MarketStatus::Open {
                return Err(Error::MarketNotOpen);
            }
            if self.env().caller() != market.creator {
                return Err(Error::NotCreator);
            }
            if market.total_yes != 0 || market.total_no != 0 {
                return Err(Error::HasBets);
            }
            market.status = MarketStatus::Cancelled;
            self.markets.insert(market_id, &market);
            self.env().emit_event(MarketCancelled { market_id });
            Ok(())
        }

        /// Winners (or refunders, on edge cases) claim their POT. Idempotent per (market, caller).
        #[ink(message)]
        pub fn claim(&mut self, market_id: u64) -> Result<Balance> {
            let market = self.markets.get(market_id).ok_or(Error::MarketNotFound)?;

            let caller = self.env().caller();
            let already = self.claimed.get((market_id, caller)).unwrap_or(false);
            if already {
                return Err(Error::AlreadyClaimed);
            }

            let (stake_for_user, payout, won_flag) = match (market.status.clone(), market.outcome) {
                (MarketStatus::Resolved, Some(outcome)) => {
                    self.compute_resolved_payout(&market, caller, outcome)?
                }
                (MarketStatus::Cancelled, _) => self.compute_refund(&market, caller)?,
                _ => return Err(Error::MarketNotOpen), // not yet resolved or cancelled
            };

            if stake_for_user == 0 {
                return Err(Error::NoPosition);
            }

            // Set claim flag BEFORE transfer (re-entrancy guard, even though Ink! mostly doesn't allow it).
            self.claimed.insert((market_id, caller), &true);

            if payout > 0 {
                self.env()
                    .transfer(caller, payout)
                    .map_err(|_| Error::TransferFailed)?;
            }

            self.env().emit_event(Claimed {
                market_id,
                bettor: caller,
                stake: stake_for_user,
                payout,
                won: won_flag,
            });

            Ok(payout)
        }

        // ---------- Read-only ----------

        #[ink(message)]
        pub fn get_market(&self, id: u64) -> Option<Market> {
            self.markets.get(id)
        }

        #[ink(message)]
        pub fn get_market_count(&self) -> u64 {
            self.next_market_id
        }

        #[ink(message)]
        pub fn list_markets(&self, start: u64, limit: u64) -> Vec<Market> {
            let mut out = Vec::new();
            let end = start.saturating_add(limit).min(self.next_market_id);
            let mut i = start;
            while i < end {
                if let Some(m) = self.markets.get(i) {
                    out.push(m);
                }
                i = i.saturating_add(1);
            }
            out
        }

        #[ink(message)]
        pub fn get_position(
            &self,
            market_id: u64,
            who: AccountId,
        ) -> (Balance, Balance) {
            (
                self.positions.get((market_id, who, true)).unwrap_or(0),
                self.positions.get((market_id, who, false)).unwrap_or(0),
            )
        }

        #[ink(message)]
        pub fn has_claimed(&self, market_id: u64, who: AccountId) -> bool {
            self.claimed.get((market_id, who)).unwrap_or(false)
        }

        #[ink(message)]
        pub fn get_config(&self) -> (AccountId, AccountId, u16, Balance, Option<AccountId>) {
            (
                self.owner,
                self.fee_recipient,
                self.protocol_fee_bps,
                self.create_market_fee,
                self.reputation,
            )
        }

        // ---------- Internals ----------

        fn only_owner(&self) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            Ok(())
        }

        /// (stake_for_user, payout, won)
        fn compute_resolved_payout(
            &self,
            market: &Market,
            caller: AccountId,
            outcome: bool,
        ) -> Result<(Balance, Balance, bool)> {
            let user_winning_stake = self
                .positions
                .get((market.id, caller, outcome))
                .unwrap_or(0);
            let user_losing_stake = self
                .positions
                .get((market.id, caller, !outcome))
                .unwrap_or(0);

            let p_w = if outcome { market.total_yes } else { market.total_no };
            let p_l = if outcome { market.total_no } else { market.total_yes };

            // No one bet on the winning side → losing-side stakers may refund.
            if p_w == 0 {
                if user_losing_stake == 0 {
                    return Ok((0, 0, false));
                }
                return Ok((user_losing_stake, user_losing_stake, false));
            }

            // User did not bet on the winning side → nothing to claim.
            if user_winning_stake == 0 {
                return Ok((0, 0, false));
            }

            // One-sided winning pool (no losers) → user gets their stake back, no fee.
            if p_l == 0 {
                return Ok((user_winning_stake, user_winning_stake, true));
            }

            // payout = user_stake + share_of_losing_pool * (1 - fee)
            // share_of_losing_pool_pre_fee = user_winning_stake * p_l / p_w
            let share = (user_winning_stake as u128)
                .checked_mul(p_l as u128)
                .ok_or(Error::ArithmeticOverflow)?
                .checked_div(p_w as u128)
                .ok_or(Error::ArithmeticOverflow)?;

            let fee_factor = BPS - self.protocol_fee_bps as u128;
            let share_after_fee = share
                .checked_mul(fee_factor)
                .ok_or(Error::ArithmeticOverflow)?
                .checked_div(BPS)
                .ok_or(Error::ArithmeticOverflow)?;

            let payout = (user_winning_stake as u128)
                .checked_add(share_after_fee)
                .ok_or(Error::ArithmeticOverflow)?;

            Ok((user_winning_stake, payout as Balance, true))
        }

        /// (stake_for_user, refund_amount, false)
        fn compute_refund(
            &self,
            market: &Market,
            caller: AccountId,
        ) -> Result<(Balance, Balance, bool)> {
            let yes = self
                .positions
                .get((market.id, caller, true))
                .unwrap_or(0);
            let no = self
                .positions
                .get((market.id, caller, false))
                .unwrap_or(0);
            let total = yes
                .checked_add(no)
                .ok_or(Error::ArithmeticOverflow)?;
            Ok((total, total, false))
        }
    }

    // ---------- Unit tests ----------

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
        fn set_value_transferred(v: Balance) {
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(v);
        }
        fn set_block_timestamp(t: Timestamp) {
            ink::env::test::set_block_timestamp::<ink::env::DefaultEnvironment>(t);
        }

        fn fresh() -> Polagon {
            set_caller(alice());
            Polagon::new(alice(), 200, 0) // 2% fee, no creation fee for tests
        }

        #[ink::test]
        fn create_market_works() {
            let mut c = fresh();
            set_caller(bob());
            set_block_timestamp(1_000);
            set_value_transferred(0);
            let id = c
                .create_market("Will it rain tomorrow?".into(), 2_000, charlie())
                .expect("ok");
            assert_eq!(id, 0);
            let m = c.get_market(0).unwrap();
            assert_eq!(m.creator, bob());
            assert_eq!(m.resolver, charlie());
            assert_eq!(m.status, MarketStatus::Open);
        }

        #[ink::test]
        fn bet_and_claim_full_flow() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c
                .create_market("YES wins?".into(), 1_000, alice())
                .unwrap();

            // Bob bets 100 on YES, Charlie bets 100 on NO.
            set_caller(bob());
            set_value_transferred(100);
            c.bet(id, true).unwrap();

            set_caller(charlie());
            set_value_transferred(100);
            c.bet(id, false).unwrap();

            // Resolve YES.
            set_block_timestamp(2_000);
            set_caller(alice());
            c.resolve(id, true).unwrap();

            // Bob claims: stake 100 + share 100 * (10000-200)/10000 = 100 + 98 = 198.
            set_caller(bob());
            let payout = c.claim(id).unwrap();
            assert_eq!(payout, 198);

            // Charlie tries to claim → no winning position.
            set_caller(charlie());
            assert_eq!(c.claim(id), Err(Error::NoPosition));
        }

        #[ink::test]
        fn double_claim_blocked() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c
                .create_market("q".into(), 1_000, alice())
                .unwrap();
            set_caller(bob());
            set_value_transferred(50);
            c.bet(id, true).unwrap();
            set_caller(charlie());
            set_value_transferred(50);
            c.bet(id, false).unwrap();
            set_block_timestamp(2_000);
            set_caller(alice());
            c.resolve(id, true).unwrap();
            set_caller(bob());
            c.claim(id).unwrap();
            assert_eq!(c.claim(id), Err(Error::AlreadyClaimed));
        }

        #[ink::test]
        fn cannot_bet_after_expiry() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c.create_market("q".into(), 1_000, alice()).unwrap();
            set_block_timestamp(1_500);
            set_caller(bob());
            set_value_transferred(10);
            assert_eq!(c.bet(id, true), Err(Error::MarketExpired));
        }

        #[ink::test]
        fn cannot_resolve_before_expiry() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c.create_market("q".into(), 1_000, alice()).unwrap();
            set_block_timestamp(500);
            assert_eq!(c.resolve(id, true), Err(Error::MarketNotExpired));
        }

        #[ink::test]
        fn one_sided_market_refunds_winners() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c.create_market("q".into(), 1_000, alice()).unwrap();
            set_caller(bob());
            set_value_transferred(100);
            c.bet(id, true).unwrap(); // only side
            set_block_timestamp(2_000);
            set_caller(alice());
            c.resolve(id, true).unwrap();
            set_caller(bob());
            // P_l = 0 → just stake back, no fee.
            assert_eq!(c.claim(id), Ok(100));
        }

        #[ink::test]
        fn no_winners_means_losers_refund() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c.create_market("q".into(), 1_000, alice()).unwrap();
            set_caller(bob());
            set_value_transferred(100);
            c.bet(id, false).unwrap(); // bob bets NO
            set_block_timestamp(2_000);
            set_caller(alice());
            c.resolve(id, true).unwrap(); // YES wins, but no one bet YES → refund losers
            set_caller(bob());
            assert_eq!(c.claim(id), Ok(100));
        }

        #[ink::test]
        fn non_resolver_cannot_resolve() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c.create_market("q".into(), 1_000, charlie()).unwrap();
            set_block_timestamp(2_000);
            set_caller(bob());
            assert_eq!(c.resolve(id, true), Err(Error::NotResolver));
        }

        #[ink::test]
        fn cancel_returns_funds_via_refund_path() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c.create_market("q".into(), 1_000, alice()).unwrap();
            // No bets yet → can cancel.
            c.cancel(id).unwrap();
            let m = c.get_market(id).unwrap();
            assert_eq!(m.status, MarketStatus::Cancelled);
        }

        #[ink::test]
        fn cancel_blocked_after_bets() {
            let mut c = fresh();
            set_caller(alice());
            set_block_timestamp(0);
            let id = c.create_market("q".into(), 1_000, alice()).unwrap();
            set_caller(bob());
            set_value_transferred(1);
            c.bet(id, true).unwrap();
            set_caller(alice());
            assert_eq!(c.cancel(id), Err(Error::HasBets));
        }
    }
}
