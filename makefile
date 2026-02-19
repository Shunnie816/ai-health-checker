.PHONY: clean run

VENV = venv
PYTHON = py -3.14
VENV_PYTHON = $(VENV)\Scripts\python
PIP = $(VENV)\Scripts\pip
STAMP = $(VENV)\.installed

# venvは一度だけ作る
$(VENV)\Scripts\activate:
	$(PYTHON) -m venv $(VENV)

# requirementsが更新されたらpip installだけ実行
$(STAMP): requirements.txt $(VENV)\Scripts\activate
	$(PIP) install -r requirements.txt
	type nul > $(STAMP)

venv: $(STAMP)

# src/ai_health_checker/main.pyを実行
run: venv
	$(VENV_PYTHON) src/ai_health_checker/main.py

# requirements.txtを更新(ロック更新)
compile:
	pip-compile

# requirements.txtに従ってpip install(環境同期)
sync:
	pip-sync

# requirements.txtを更新し、pip install
upgrade:
	pip-compile --upgrade

# venvを削除
clean:
	rmdir /s /q $(VENV)
