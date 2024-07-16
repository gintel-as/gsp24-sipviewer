# GSP24-SIPVIEWER

This project consists of two parts; the Sip Viewer and the Extractor. The Sip Viewer is developed as an angular application and the Extractor consists of python flask code deployed with docker.

You should have all prerequisites for angular, docker and python installed to run this project.

## Sip Viewer

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/sip-viewer` directory.

### Host Sip Viewer on NGINX

The current deployment solution uses NGINX to host the angular build. To deploy the angular build, you have to move the build files into `/usr/share/nginx/html`.

Delete existing html files: \
`sudo rm -r /usr/share/nginx/html/*`

Copy new build to NGINX: \
`sudo cp -r ~/gsp24-sipviewer/sip-viewer/dist/sip-viewer/browser/* /usr/share/nginx/html`

## Extractor

The extractor consists of several python files where app.py functions as the API interface.

### Docker deployment

You should have docker installed and navigated to the extractor directory.

Build docker image: \
`docker build -t extractor/flask-app .`

Run docker container: \
`docker run -p 5000:5000 extractor/flask-app`

Run docker container in detached mode: \
`docker run -d -p 5000:5000 extractor/flask-app`

### Run Flask

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
