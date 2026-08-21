'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, Music, Image as ImageIcon, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export function UploadModal() {
  const { isUploadModalOpen, toggleUploadModal } = usePlayerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('/samples/covers/cyberpunk.jpg');

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [duration, setDuration] = useState(180);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isUploadModalOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac', 'audio/mp3'];
    const isAudio = validTypes.includes(file.type) || /\.(mp3|wav|flac)$/i.test(file.name);

    if (!isAudio) {
      setErrorMsg('Please upload a valid audio file (.mp3, .wav, or .flac)');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);

    // Auto-parse filename for title and artist (e.g. "Artist - Track Title.mp3")
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ');
      setArtist(parts[0].trim());
      setTitle(parts[1].trim());
    } else {
      setTitle(nameWithoutExt);
      setArtist('Unknown Artist');
    }

    setAlbum('Single Upload');

    // Measure duration using Audio element metadata
    const audioObj = new Audio();
    audioObj.src = URL.createObjectURL(file);
    audioObj.onloadedmetadata = () => {
      if (audioObj.duration && !isNaN(audioObj.duration)) {
        setDuration(Math.round(audioObj.duration));
      }
    };
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const cover = e.target.files[0];
      setSelectedCover(cover);
      setCoverPreview(URL.createObjectURL(cover));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select an audio file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      // 1. Upload audio file & cover to storage endpoint
      const formData = new FormData();
      formData.append('audio', selectedFile);
      if (selectedCover) {
        formData.append('cover', selectedCover);
      }

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to save file to server storage');
      }

      const uploadData = await uploadRes.json();

      // 2. Create track record in database
      const trackRes = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || selectedFile.name,
          artist: artist || 'Unknown Artist',
          album: album || 'Single',
          genre,
          duration,
          audioUrl: uploadData.audioUrl,
          coverUrl: uploadData.coverUrl || coverPreview,
        }),
      });

      if (!trackRes.ok) {
        throw new Error('Failed to create database entry');
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(false);
        toggleUploadModal(false);
        // Refresh page or trigger state update
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setErrorMsg(err.message || 'An error occurred during upload.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-dark-bg/95 border border-dark-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-slate-950 shadow-neon">
              <UploadCloud className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Track Studio</h2>
              <p className="text-xs text-slate-400">Supported formats: .mp3, .wav, .flac</p>
            </div>
          </div>
          <button
            onClick={() => toggleUploadModal(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-brand-primary bg-brand-primary/10'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/mpeg,audio/wav,audio/flac"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <Music className="w-8 h-8 text-brand-primary" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {duration}s
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop audio file here, or{' '}
                  <span className="text-brand-primary underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">MP3, WAV, or FLAC up to 50MB</p>
              </div>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Track Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon Dreams"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Artist Name
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. SynthPulse"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Album / Single
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="e.g. Midnight EP"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-primary"
              >
                <option value="Electronic">Electronic</option>
                <option value="Synthwave">Synthwave</option>
                <option value="Lofi">Lofi</option>
                <option value="Ambient">Ambient</option>
                <option value="Cyberpunk">Cyberpunk</option>
                <option value="Pop">Pop</option>
                <option value="Hip-Hop">Hip-Hop</option>
              </select>
            </div>
          </div>

          {/* Cover Art Selection */}
          <div className="flex items-center gap-4 pt-2">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 relative flex-shrink-0">
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Album Cover Image
              </label>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-brand-primary" />
                Change Cover Art
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-dark-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => toggleUploadModal(false)}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-slate-950 font-bold text-sm shadow-neon hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  Uploaded!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Publish Track
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
