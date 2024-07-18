from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from main import Main
import os, threading, sched, time, shutil
from flask_apscheduler import APScheduler

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
    
    finally:
        inputFile_path = os.path.join(logPath, inputFile)
        try:
            if os.path.exists(inputFile_path):
                os.remove(inputFile_path)
                print(f"Deleted uploaded file: {inputFile_path}")
        except Exception as e:
            print(f"Error deleting uploaded file {inputFile_path}: {e}")


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
    processed_filepath = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    try:
        if not os.path.exists(processed_filepath):
            return jsonify({'message': 'File not found'}), 404
        
        response = send_from_directory(app.config['PROCESSED_FOLDER'], filename, as_attachment=True)
        os.remove(processed_filepath)
        return response
    
    except FileNotFoundError:
        return jsonify({'message': 'File not found'}), 404
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

def delete_folder_contents(folder):
    for filename in os.listdir(folder):
        file_path = os.path.join(folder, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))

def job():
    print("Deleting upload and processed folder content")
    delete_folder_contents(app.config['UPLOAD_FOLDER'])
    delete_folder_contents(app.config['PROCESSED_FOLDER'])

if __name__ == '__main__':
    scheduler = APScheduler()
    scheduler.add_job(id='Scheduled Task', func=job, trigger='cron', hour=23, minute=00)
    scheduler.start()

    app.run(debug=True)