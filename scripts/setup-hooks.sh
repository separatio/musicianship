#!/usr/bin/env bash
# Point this clone's git hooks at .githooks/ (local config, run once per clone).
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
echo "core.hooksPath set to .githooks — pre-commit gate enabled for this clone."
