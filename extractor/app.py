from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from main import Main
import os, threading

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER


def processFile(inputFile, logPath, destinationPath, sessionID, startTime, endTime, sipTo, sipFrom):
    try:
        main_instance = Main(inputFile, logPath, destinationPath)
        main_instance.extractor()
        main_instance.logInterperter(sessionID, sipTo, sipFrom, startTime, endTime)
    except Exception as e:
        print(f"Error processing file {inputFile}: {e}")


@app.route('/api/uploadAndExtract', methods=['POST'])
def uploadAndExtract():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file:
        try:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)

            # Turn string of sessionIDs into array
            sessionID = request.form.get('sessionID', '')
            if sessionID == '':
                sessionIDArray = []
            else:
                sessionIDArray = [x.strip() for x in sessionID.split(',')]

            sipTo = request.form.get('sipTo', '')
            sipFrom = request.form.get('sipFrom', '')
            startTime = request.form.get('startTime', '')
            endTime = request.form.get('endTime', '')

            print("sipTo: ", sipTo)
            print("sipFrom: ", sipFrom)
            print("startTime: ", startTime)
            print("endTime: ", endTime)

            # Start file processing in a separate thread
            threading.Thread(target=processFile, args=(file.filename, app.config['UPLOAD_FOLDER'], app.config['PROCESSED_FOLDER'], sessionIDArray, sipTo, sipFrom, startTime, endTime)).start()
            
            processed_filename = f"{file.filename}.json"
            return jsonify({'message': 'File uploaded and processing started', 'processed_filename': processed_filename}), 200

        except Exception as e:
                return jsonify({'message': f'Error uploading or processing file: {e}'}), 500


@app.route('/api/check_status/<filename>', methods=['GET'])
def check_status(filename):
    processed_filepath = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    if os.path.exists(processed_filepath):
        return jsonify({'status': 'ready'}), 200
    else:
        return jsonify({'status': 'processing'}), 202


@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        return send_from_directory(app.config['PROCESSED_FOLDER'], filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'message': 'File not found'}), 404


if __name__ == '__main__':
    app.run(debug=True)