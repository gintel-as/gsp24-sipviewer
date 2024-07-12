# GSP24-SIPVIEWER

## Angular sip-viewer

Make sure to have nodejs and the angular cli installed beforehand.

Install angular dependencies:\
`npm install`

Build and run the application:\
`ng serve --open`

Only build the application:\
`ng build`

## Extractor

The extractor consists of several python files where app.py functions as the API interface.

Make sure to be in the extractor directory, and have python3 and python3-venv installed. The steps to install and run the flask applicaton are as follows:

1. Create a virtual environment:\
   `python3 -m venv .venv`

2. Activate the virtual environment:\
   `. .venv/bin/activate`

3. Install dependencies in the virtual environment:\
   `pip install -r requirements.txt`

4. Run app.py:\
   `flask --app app run`

Sometimes when stopping the application, the standard port flask uses might still be reserved. If this happens, you can free up the port.\
`fuser -k 5000/tcp`
