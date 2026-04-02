import React, { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { contentService, getAssetUrl } from '../../services/api';

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

export default function ImageUpload({ currentImage, onUpload, allowMultiple = false, maxFiles = 1 }) {
    const [files, setFiles] = useState([]);

    const handleProcessFile = async (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
        console.log('Starting upload for file:', file.name);
        const formData = new FormData();
        formData.append('image', file);

        try {
            console.log('Sending request to /api/upload...');
            const res = await contentService.uploadMedia(formData);
            console.log('Upload success:', res.data);
            const url = res.data.url;
            load(url);
            onUpload(url);
        } catch (err) {
            console.error('Upload failed error object:', err);
            error('Upload failed');
        }
    };

    return (
        <div className="space-y-3">
            {currentImage && !allowMultiple && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-stone-200">
                    <img src={getAssetUrl(currentImage)} alt="Current" className="w-full h-full object-cover" />
                </div>
            )}
            <FilePond
                files={files}
                onupdatefiles={setFiles}
                allowMultiple={allowMultiple}
                maxFiles={maxFiles}
                name="image"
                acceptedFileTypes={['image/*']}
                labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                server={{
                    process: handleProcessFile
                }}
                credits={false}
                className="filepond-custom"
            />
        </div>
    );
}
