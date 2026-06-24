.PHONY: venv run lint lint-fix format typecheck test compile sync upgrade clean

VENV = venv
PYTHON = py -3.14
VENV_PYTHON = $(VENV)/Scripts/python
PIP = $(VENV)/Scripts/pip
STAMP = $(VENV)/.installed

# venvは一度だけ作る
$(VENV)/Scripts/activate:
	$(PYTHON) -m venv $(VENV)

# requirementsが更新されたらpip installだけ実行
$(STAMP): requirements.txt $(VENV)/Scripts/activate
	$(PIP) install -r requirements.txt
	$(VENV_PYTHON) -c "open('$(STAMP)', 'w').close()"

venv: $(STAMP)

# src/ai_health_checker/main.pyを実行
run: venv
	PYTHONPATH=src $(VENV_PYTHON) -m ai_health_checker.main

# requirements.txtを更新(ロック更新)
compile:
	$(VENV)/Scripts/pip-compile

# requirements.txtに従ってpip install(環境同期)
sync:
	$(VENV)/Scripts/pip-sync

# requirements.txtを更新し、pip install
upgrade:
	$(VENV)/Scripts/pip-compile --upgrade

lint: venv
	$(VENV_PYTHON) -m ruff check src/

lint-fix: venv
	$(VENV_PYTHON) -m ruff check --fix src/
	$(VENV_PYTHON) -m black src/

format: venv
	$(VENV_PYTHON) -m black src/

typecheck: venv
	$(VENV_PYTHON) -m mypy src/

test: venv
	PYTHONPATH=src $(VENV_PYTHON) -m pytest tests/ -v; \
	exit_code=$$?; [ $$exit_code -eq 5 ] && exit 0 || exit $$exit_code

# venvを削除
clean:
	rm -rf $(VENV)
