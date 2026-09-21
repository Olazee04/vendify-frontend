'use client';
import { useState, useRef } from 'react';
import {
  Sparkles, Upload, Camera, X,
  RefreshCw, Check, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface AIGeneratedProduct {
  productName: string;
  category: string;
  description: string;
  shortDescription: string;
  color: string;
  material: string;
  style: string;
  suggestedTags: string[];
  seoTitle: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface Props {
  onApply: (data: {
    name: string;
    description: string;
    tags: string;
    categoryHint: string;
  }) => void;
}

export default function AIProductDescriptionGenerator({
  onApply
}: Props) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] =
    useState<AIGeneratedProduct | null>(null);
  const [editedResult, setEditedResult] =
    useState<AIGeneratedProduct | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setImage(file);
    setResult(null);
    setEditedResult(null);

    const reader = new FileReader();
    reader.onload = (e) =>
      setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!image) {
      toast.error('Please upload an image first');
      return;
    }

    setGenerating(true);
    try {
      const fd = new FormData();
      fd.append('image', image);

      const res = await api.post(
        '/ai/generate-product-description',
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        }
      );

      const data = res.data.data as AIGeneratedProduct;
      setResult(data);
      setEditedResult({ ...data });
      toast.success('Description generated!');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message
          || 'Generation failed. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (!editedResult) return;

    onApply({
      name: editedResult.productName,
      description: editedResult.description,
      tags: editedResult.suggestedTags.join(', '),
      categoryHint: editedResult.category,
    });

    toast.success('Applied to product form!');
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setEditedResult(null);
  };

  const confidenceConfig = {
    high: {
      color: 'text-green-600 bg-green-50 border-green-200',
      label: 'High confidence'
    },
    medium: {
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      label: 'Medium confidence'
    },
    low: {
      color: 'text-red-600 bg-red-50 border-red-200',
      label: 'Low confidence — please review carefully'
    },
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5
          bg-linear-to-r from-purple-600 to-indigo-600
          text-white rounded-xl text-sm font-semibold
          hover:from-purple-700 hover:to-indigo-700
          transition-all shadow-md hover:shadow-lg">
        <Sparkles size={16} />
        AI Generate Description
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-50
          flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              resetState();
            }
          }}>
          <div className="bg-white rounded-2xl w-full
            max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between
              p-6 border-b border-gray-100 sticky top-0
              bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl
                   bg-linear-to-r from-purple-500
                  to-indigo-600 flex items-center
                  justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">
                    AI Product Description
                  </h2>
                  <p className="text-xs text-gray-500">
                    Upload a product photo and let AI do the work
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); resetState(); }}
                className="text-gray-400 hover:text-gray-600
                  p-2 hover:bg-gray-100 rounded-xl
                  transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold
                  text-gray-700 mb-3">
                  Product Image
                </label>

                {!preview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200
                      rounded-2xl p-10 text-center cursor-pointer
                      hover:border-purple-400 hover:bg-purple-50
                      transition-all group">
                    <Upload size={36} className="text-gray-300
                      group-hover:text-purple-400 mx-auto mb-3
                      transition-colors" />
                    <p className="font-semibold text-gray-500
                      group-hover:text-purple-600 mb-1">
                      Click to upload product photo
                    </p>
                    <p className="text-xs text-gray-400">
                      JPEG, PNG, WebP — Max 10MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Product preview"
                      className="w-full max-h-64 object-contain
                        rounded-2xl border border-gray-200 bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        setPreview(null);
                        setImage(null);
                        setResult(null);
                        setEditedResult(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 w-8 h-8
                        bg-red-500 text-white rounded-full flex
                        items-center justify-center hover:bg-red-600
                        transition-colors">
                      <X size={14} />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 flex
                        items-center gap-1.5 px-3 py-1.5 bg-white
                        text-gray-600 rounded-lg text-xs font-medium
                        shadow-md hover:bg-gray-50 border
                        border-gray-200">
                      <RefreshCw size={12} />
                      Change
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              {/* Generate Button */}
              {preview && !result && (
                <button
                  onClick={generate}
                  disabled={generating}
                  className="w-full flex items-center
                    justify-center gap-3 py-4  bg-linear-to-r
                    from-purple-600 to-indigo-600 text-white
                    rounded-xl font-bold text-sm
                    hover:from-purple-700 hover:to-indigo-700
                    disabled:opacity-70 disabled:cursor-not-allowed
                    transition-all shadow-md">
                  {generating ? (
                    <>
                      <Loader2 size={18}
                        className="animate-spin" />
                      Analyzing image with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Product Description
                    </>
                  )}
                </button>
              )}

              {generating && (
                <div className="text-center py-4">
                  <div className="flex items-center
                    justify-center gap-2 text-purple-600
                    text-sm font-medium mb-2">
                    <Loader2 size={16}
                      className="animate-spin" />
                    Claude AI is analyzing your product...
                  </div>
                  <p className="text-xs text-gray-400">
                    This usually takes 5-15 seconds
                  </p>
                </div>
              )}

              {/* Results */}
              {editedResult && (
                <div className="space-y-4">

                  {/* Confidence Badge */}
                  <div className={`flex items-center gap-2
                    px-4 py-2.5 rounded-xl border text-sm
                    font-medium ${
                      confidenceConfig[
                        editedResult.confidence
                      ].color
                    }`}>
                    <AlertCircle size={16} />
                    {confidenceConfig[editedResult.confidence].label}
                    {editedResult.notes && (
                      <span className="font-normal ml-1">
                        — {editedResult.notes}
                      </span>
                    )}
                  </div>

                  {/* Generated Fields */}
                  <div className="space-y-4">

                    <div>
                      <label className="block text-xs font-bold
                        text-gray-500 uppercase tracking-wider mb-1.5">
                        Product Name
                      </label>
                      <input
                        value={editedResult.productName}
                        onChange={e =>
                          setEditedResult(prev => prev
                            ? { ...prev, productName: e.target.value }
                            : prev
                          )
                        }
                        className="w-full px-4 py-3 border
                          border-gray-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2
                          focus:ring-purple-500 text-gray-900
                          font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold
                          text-gray-500 uppercase tracking-wider mb-1.5">
                          Category
                        </label>
                        <input
                          value={editedResult.category}
                          onChange={e =>
                            setEditedResult(prev => prev
                              ? { ...prev, category: e.target.value }
                              : prev
                            )
                          }
                          className="w-full px-3 py-2.5 border
                            border-gray-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2
                            focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold
                          text-gray-500 uppercase tracking-wider mb-1.5">
                          Style
                        </label>
                        <input
                          value={editedResult.style}
                          onChange={e =>
                            setEditedResult(prev => prev
                              ? { ...prev, style: e.target.value }
                              : prev
                            )
                          }
                          className="w-full px-3 py-2.5 border
                            border-gray-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2
                            focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold
                          text-gray-500 uppercase tracking-wider mb-1.5">
                          Color
                        </label>
                        <input
                          value={editedResult.color}
                          onChange={e =>
                            setEditedResult(prev => prev
                              ? { ...prev, color: e.target.value }
                              : prev
                            )
                          }
                          className="w-full px-3 py-2.5 border
                            border-gray-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2
                            focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold
                          text-gray-500 uppercase tracking-wider mb-1.5">
                          Material
                        </label>
                        <input
                          value={editedResult.material}
                          onChange={e =>
                            setEditedResult(prev => prev
                              ? { ...prev, material: e.target.value }
                              : prev
                            )
                          }
                          className="w-full px-3 py-2.5 border
                            border-gray-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2
                            focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold
                        text-gray-500 uppercase tracking-wider mb-1.5">
                        Short Description
                      </label>
                      <input
                        value={editedResult.shortDescription}
                        onChange={e =>
                          setEditedResult(prev => prev
                            ? { ...prev, shortDescription: e.target.value }
                            : prev
                          )
                        }
                        className="w-full px-4 py-3 border
                          border-gray-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2
                          focus:ring-purple-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold
                        text-gray-500 uppercase tracking-wider mb-1.5">
                        Full Description
                        <span className="ml-2 text-purple-500
                          font-normal normal-case">
                          (edit as needed)
                        </span>
                      </label>
                      <textarea
                        value={editedResult.description}
                        onChange={e =>
                          setEditedResult(prev => prev
                            ? { ...prev, description: e.target.value }
                            : prev
                          )
                        }
                        rows={5}
                        className="w-full px-4 py-3 border
                          border-gray-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2
                          focus:ring-purple-500 text-gray-900
                          resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold
                        text-gray-500 uppercase tracking-wider mb-1.5">
                        Suggested Tags
                      </label>
                      <div className="flex flex-wrap gap-2 p-3
                        border border-gray-200 rounded-xl
                        min-h-12">
                        {editedResult.suggestedTags.map(
                          (tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center
                              gap-1 px-2.5 py-1 bg-purple-100
                              text-purple-700 text-xs rounded-full
                              font-medium">
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                setEditedResult(prev => prev
                                  ? {
                                      ...prev,
                                      suggestedTags: prev
                                        .suggestedTags
                                        .filter((_, j) => j !== i)
                                    }
                                  : prev
                                )
                              }
                              className="text-purple-400
                                hover:text-purple-600">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Click × to remove a tag
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold
                        text-gray-500 uppercase tracking-wider mb-1.5">
                        SEO Title
                      </label>
                      <input
                        value={editedResult.seoTitle}
                        onChange={e =>
                          setEditedResult(prev => prev
                            ? { ...prev, seoTitle: e.target.value }
                            : prev
                          )
                        }
                        className="w-full px-4 py-3 border
                          border-gray-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2
                          focus:ring-purple-500 text-gray-900"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {editedResult.seoTitle.length}/60 characters
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2 border-t
                    border-gray-100">
                    <button
                      type="button"
                      onClick={generate}
                      disabled={generating}
                      className="flex items-center gap-2 px-4
                        py-3 border border-gray-200 text-gray-600
                        rounded-xl text-sm font-medium
                        hover:bg-gray-50 transition-colors">
                      <RefreshCw size={14} />
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      className="flex-1 flex items-center
                        justify-center gap-2 py-3 bg-purple-600
                        text-white rounded-xl text-sm font-bold
                        hover:bg-purple-700 transition-colors">
                      <Check size={16} />
                      Use This Description
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}