# SIP-Viewer

## Extractor

python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt

fuser -k 5000/tcp

flask --app app run
