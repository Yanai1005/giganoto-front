.PHONY: help
help:
	@echo "使用方法:"
	@echo "  make game NAME=<ゲーム名> TITLE=<タイトル>  - 新しいゲームを生成"
	@echo "  make clean-game TYPE=<ゲームタイプ>         - 指定したゲームを削除"
	@echo "  make list-games                           - 既存のゲーム一覧を表示"
	@echo ""
	@echo "例:"
	@echo "  make game NAME=space TITLE=\"スペースゲーム\""
	@echo "  make clean-game TYPE=space"
# ゲーム生成
.PHONY: game
game:
	@if [ -z "$(NAME)" ] || [ -z "$(TITLE)" ]; then \
		echo "エラー: NAME と TITLE を指定してください"; \
		echo "例: make game NAME=space TITLE=\"スペースゲーム\""; \
		exit 1; \
	fi
	@echo "🎮 \"$(TITLE)\" を生成中..."
	@node game-generator.js "$(NAME)" "$(TITLE)"

# ゲーム削除
.PHONY: clean-game
clean-game:
	@if [ -z "$(TYPE)" ]; then \
		echo "エラー: TYPE を指定してください"; \
		echo "例: make clean-game TYPE=space"; \
		exit 1; \
	fi
	@echo "🗑️  ゲーム \"$(TYPE)\" を削除中..."
	@rm -rf src/games/$(TYPE)
	@echo "✅ ディレクトリ削除完了"
	@echo "⚠️  GameRegistry.js と games.json は手動で更新してください"

# 既存ゲーム一覧表示
.PHONY: list-games
list-games:
	@echo "📋 既存のゲーム:"
	@if [ -d "src/games" ]; then \
		ls -la src/games/ | grep "^d" | awk '{print "  - " $$9}' | grep -v "^\s*-\s*\.\.*$$"; \
	else \
		echo "  ゲームディレクトリが見つかりません"; \
	fi
