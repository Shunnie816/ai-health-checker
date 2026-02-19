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

# app.pyを実行
run: venv
	$(VENV_PYTHON) app.py

# requirements.txtを更新
compile:
	pip-compile

# requirements.txtに従ってpip install
sync:
	pip-sync

# requirements.txtを更新し、pip install
upgrade:
	pip-compile --upgrade

# venvを削除
clean:
	rmdir /s /q $(VENV)
