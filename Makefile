# Polagon — orchestration Makefile.
# `make help` for the menu.

.PHONY: help install build-contracts test-contracts node deploy seed dev fmt clean

RPC_URL ?= ws://127.0.0.1:9944
DEPLOYER_SURI ?= //Alice

help:
	@echo "Polagon — make targets:"
	@echo ""
	@echo "  install           — install all JS dependencies (frontend + scripts)"
	@echo "  build-contracts   — cargo contract build --release for both contracts"
	@echo "  test-contracts    — cargo test --workspace (off-chain unit tests)"
	@echo "  node              — start a local substrate-contracts-node"
	@echo "  deploy            — deploy + wire both contracts; writes frontend/.env.local"
	@echo "                       (env: RPC_URL=$(RPC_URL), DEPLOYER_SURI=$(DEPLOYER_SURI))"
	@echo "  seed              — create 5 demonstration markets on the deployed protocol"
	@echo "  dev               — run the frontend dev server (http://localhost:3000)"
	@echo "  fmt               — cargo fmt + prettier"
	@echo "  clean             — remove build artifacts"

install:
	cd frontend && pnpm install
	cd scripts  && pnpm install

build-contracts:
	cd contracts/prediction_market && cargo contract build --release
	cd contracts/reputation         && cargo contract build --release

test-contracts:
	cd contracts && cargo test --workspace --features std

node:
	@command -v substrate-contracts-node >/dev/null 2>&1 || { \
	  echo "substrate-contracts-node not found."; \
	  echo "Install: cargo install contracts-node --force"; \
	  exit 1; \
	}
	substrate-contracts-node --dev --tmp

deploy:
	cd scripts && RPC_URL=$(RPC_URL) DEPLOYER_SURI=$(DEPLOYER_SURI) pnpm deploy

seed:
	cd scripts && RPC_URL=$(RPC_URL) DEPLOYER_SURI=$(DEPLOYER_SURI) pnpm seed

dev:
	cd frontend && pnpm dev

fmt:
	cd contracts && cargo fmt --all
	cd frontend  && pnpm exec prettier --write src

clean:
	cd contracts/prediction_market && cargo clean
	cd contracts/reputation         && cargo clean
	rm -rf frontend/.next frontend/node_modules scripts/node_modules
