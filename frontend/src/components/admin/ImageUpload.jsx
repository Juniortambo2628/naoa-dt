import React, { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import imageCompression from 'browser-image-compression';
import { contentService, getAssetUrl } from '../../services/api';

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

export default function ImageUpload({ 
    currentImage, 
    onUpload, 
    allowMultiple = false, 
    maxFiles = 1, 
    className = "", 
    showList = true,
    onFileAdded = () => {},
    onFileRemoved = () => {},
    onFileProgress = () => {}
}) {
    const [files, setFiles] = useState([]);

    const handleProcessFile = async (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
        // We need to find the FilePond item id. 
        // FilePond doesn't passing it directly to process, but we can match by file name and size
        const item = files.find(f => f.file.name === file.name && f.file.size === file.size);
        const fileId = item ? item.id : (file.name + '-' + file.size);
        
        console.log('Starting upload for file:', file.name, 'with ID:', fileId);
        
        // Compression options
        const compressionOptions = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            onProgress: (val) => {
                // Compression progress (0-50%)
                onFileProgress(fileId, val * 0.5);
            }
        };

        try {
            const compressedFile = await imageCompression(file, compressionOptions);
            
            const formData = new FormData();
            formData.append('image', compressedFile, file.name);

            // Start server upload phase (base 50%)
            onFileProgress(fileId, 0.5);

            const res = await contentService.uploadMedia(formData, (percent) => {
                // Map 0-100% of upload to 50-100% of total progress
                const totalProgress = 0.5 + (percent / 100) * 0.5;
                onFileProgress(fileId, totalProgress);
            });
            
            // Success (100%)
            onFileProgress(fileId, 1);
            load(res.data.url);
            onUpload(res.data.url, fileId);
        } catch (err) {
            console.error('Upload or compression failed:', err);
            error('Upload failed');
        }
    };

    return (
        <div className={`space-y-3 ${!showList ? 'hide-filepond-list' : ''}`}>
            {currentImage && !allowMultiple && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-stone-200">
                    <img src={getAssetUrl(currentImage)} alt="Current" className="w-full h-full object-cover" />
                </div>
            )}
            <FilePond
                files={files}
                onupdatefiles={(fileItems) => {
                    setFiles(fileItems);
                }}
                onaddfile={(err, item) => {
                    if (!err) onFileAdded(item);
                }}
                onremovefile={(err, item) => {
                    if (!err) onFileRemoved(item.id);
                }}
                allowMultiple={allowMultiple}
                maxFiles={maxFiles}
                name="image"
                acceptedFileTypes={['image/*']}
                labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                server={{
                    process: handleProcessFile
                }}
                credits={false}
                className={className}
            />
        </div>
    );
}
