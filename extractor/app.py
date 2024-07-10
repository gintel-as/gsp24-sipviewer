from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from main import Main
import os

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

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        return jsonify({'message': 'File uploaded successfully', 'filename': file.filename}), 200

@app.route('/api/process_file', methods=['POST'])
def process_file():
    data = request.json
    filename = data.get('filename')
    additional_string = data.get('additional_string', '')

    if not filename or not os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
        return jsonify({'message': 'File not found'}), 404

    inputFile = filename
    logPath = app.config['UPLOAD_FOLDER']
    destinationPath = app.config['PROCESSED_FOLDER']

    print(inputFile)
    print(logPath)
    print(destinationPath)

    # Initialize and run the Main class from main.py
    main_instance = Main(inputFile, logPath, destinationPath)
    main_instance.extractor()
    main_instance.logInterperter(additional_string)  # Use additional_string as sessionID

    processed_filename = f"{filename}.json"
    processed_filepath = os.path.join(destinationPath, processed_filename)

    return jsonify({'message': 'File processed successfully', 'processed_filename': processed_filename}), 200

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    print(f"Download request for: {filename}")  # Debug download filename
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename, as_attachment=True)





if __name__ == '__main__':
    app.run(debug=True)