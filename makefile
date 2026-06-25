.PHONY: venv run lint lint-fix format typecheck test compile sync upgrade clean docker-build docker-up docker-down

VENV = venv
PYTHON = py -3.14
VENV_PYTHON = $(VENV)/Scripts/python
PIP = $(VENV)/Scripts/pip
STAMP = $(VENV)/.installed

# venvは一度だけ作る
$(VENV)/Scripts/activate:
	$(PYTHON) -m venv $(VENV)

# requirementsが更新されたらpip installだけ実行
$(STAMP): backend/requirements.txt $(VENV)/Scripts/activate
	$(PIP) install -r backend/requirements.txt
	$(VENV_PYTHON) -c "open('$(STAMP)', 'w').close()"

venv: $(STAMP)

run: venv
	PYTHONPATH=backend/src $(VENV)/Scripts/uvicorn ai_health_checker.main:app --reload --port 8000

# requirements.txtを更新(ロック更新)
compile:
	$(VENV)/Scripts/pip-compile backend/requirements.in --output-file backend/requirements.txt

# requirements.txtに従ってpip install(環境同期)
sync:
	$(VENV)/Scripts/pip-sync backend/requirements.txt

# requirements.txtを更新し、pip install
upgrade:
	$(VENV)/Scripts/pip-compile --upgrade backend/requirements.in --output-file backend/requirements.txt

lint: venv
	$(VENV_PYTHON) -m ruff check backend/src/

lint-fix: venv
	$(VENV_PYTHON) -m ruff check --fix backend/src/
	$(VENV_PYTHON) -m black backend/src/

format: venv
	$(VENV_PYTHON) -m black backend/src/

typecheck: venv
	$(VENV_PYTHON) -m mypy backend/src/

test: venv
	PYTHONPATH=backend/src $(VENV_PYTHON) -m pytest backend/tests/ -v; \
	exit_code=$$?; [ $$exit_code -eq 5 ] && exit 0 || exit $$exit_code

docker-build:
	docker compose build

docker-up:
	docker compose up

docker-down:
	docker compose down

# venvを削除
clean:
	rm -rf $(VENV)
