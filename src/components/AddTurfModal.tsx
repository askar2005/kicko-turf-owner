import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SLOT_TIMES = [
    "06:00 - 07:00", "07:00 - 08:00", "08:00 - 09:00", "09:00 - 10:00",
    "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00",
    "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00",
    "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00",
    "22:00 - 23:00", "23:00 - 00:00"
];

interface AddTurfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddTurfModal({ isOpen, onClose }: AddTurfModalProps) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: 'Kicko Elite Arena',
        area: 'Anna Nagar',
        location: '123 Sports Avenue, Anna Nagar East',
        sportType: 'Football',
        capacity: '5',
        latitude: '13.0827',
        longitude: '80.2707',
        city: 'Chennai',
        slotPrices: SLOT_TIMES.reduce((acc, slot) => ({ ...acc, [slot]: '1200' }), {} as Record<string, string>),
        amenities: 'Water, Changing Room, Floodlights',
        isActive: true,
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [activeSlots, setActiveSlots] = useState<Record<string, boolean>>(
        SLOT_TIMES.reduce((acc, slot) => ({ ...acc, [slot]: true }), {} as Record<string, boolean>)
    );

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSlotPriceChange = (slot: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            slotPrices: {
                ...prev.slotPrices,
                [slot]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();



        const getAuthHeaders = () => {
            const profileStr = localStorage.getItem("kicko_admin_profile");
            if (profileStr) {
                try {
                    const profile = JSON.parse(profileStr);
                    if (profile && profile.token) {
                        return { "Authorization": `Bearer ${profile.token}` };
                    }
                } catch { }
            }
            return {};
        };

        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('area', formData.area);
            fd.append('location', formData.location);
            fd.append('sportType', formData.sportType);
            fd.append('capacity', formData.capacity);
            fd.append('latitude', formData.latitude);
            fd.append('longitude', formData.longitude);
            fd.append('city', formData.city);
            fd.append('amenities', formData.amenities);

            const activeSlotsList = Object.keys(activeSlots).filter(slot => activeSlots[slot]);
            fd.append('activeSlots', JSON.stringify(activeSlotsList));

            const filteredSlotPrices: Record<string, number> = {};
            activeSlotsList.forEach(slot => {
                filteredSlotPrices[slot] = Number(formData.slotPrices[slot] || 1200);
            });
            fd.append('slotPrices', JSON.stringify(filteredSlotPrices));

            const pricePerHour = Number(activeSlotsList.length > 0 ? (formData.slotPrices[activeSlotsList[0]] || 1200) : 1200);
            fd.append('pricePerHour', String(pricePerHour));

            selectedFiles.forEach((file) => {
                fd.append('images', file);
            });

            const res = await fetch('http://localhost:5000/api/turfs', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders()
                },
                body: fd
            });
            if (res.ok) {
                alert('Turf created successfully!');
                onClose();
                setFormData({
                    name: '',
                    area: '',
                    location: '',
                    sportType: '',
                    capacity: '',
                    latitude: '',
                    longitude: '',
                    city: '',
                    slotPrices: SLOT_TIMES.reduce((acc, slot) => ({ ...acc, [slot]: '1200' }), {} as Record<string, string>),
                    amenities: '',
                    isActive: true,
                });
                setSelectedFiles([]);
                setActiveSlots(SLOT_TIMES.reduce((acc, slot) => ({ ...acc, [slot]: true }), {} as Record<string, boolean>));
                window.location.reload();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(`Failed to create turf: ${data.error || res.statusText || 'Unknown server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to backend');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 font-sans">
            <div className="bg-white/95 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-white/60 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative flex flex-col">
                <div className="bg-white px-6 sm:px-8 py-5 flex items-center justify-between border-b border-slate-100/60 shrink-0">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-slate-800">Add New Turf</h2>
                        <p className="text-xs text-slate-500 mt-1">Configure turf details and dynamic pricing slots</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 hover:bg-rose-50 rounded-full transition-colors text-slate-400 hover:text-rose-500 shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:px-8 sm:py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Turf Name</label>
                            <input
                                type="text"
                                name="name"

                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white"
                                placeholder="e.g. Green Field Arena"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Area</label>
                            <input
                                type="text"
                                name="area"

                                value={formData.area}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white"
                                placeholder="e.g. Anna Nagar"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">City</label>
                            <input
                                type="text"
                                name="city"

                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white"
                                placeholder="e.g. Chennai"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Turf Location</label>
                            <input
                                type="text"
                                name="location"

                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white"
                                placeholder="e.g. Near Anna Nagar Metro, Chennai"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Type of Sports</label>
                            <select
                                name="sportType"

                                value={formData.sportType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white appearance-none"
                            >
                                <option value="" disabled>Select a sport</option>
                                <option value="Cricket">Cricket</option>
                                <option value="Football">Football</option>
                                <option value="Basketball">Basketball</option>
                                <option value="Hockey">Hockey</option>
                                <option value="Baseball">Baseball</option>
                                <option value="Tennis">Tennis</option>
                                <option value="Badminton">Badminton</option>
                                <option value="Volleyball">Volleyball</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Turf Capacity</label>
                            <select
                                name="capacity"

                                value={formData.capacity}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white appearance-none"
                            >
                                <option value="" disabled>Select capacity</option>
                                {[5, 6, 7, 8, 9, 10, 11, 12, 15].map(num => (
                                    <option key={num} value={num}>Members per team {num}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Turf Images</label>
                            <div
                                className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-teal-50/10 flex flex-col items-center justify-center space-y-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const files = Array.from(e.dataTransfer.files);
                                    const imageFiles = files.filter(f => f.type.startsWith('image/'));
                                    setSelectedFiles(prev => [...prev, ...imageFiles]);
                                }}
                                onClick={() => document.getElementById('image-upload-input')?.click()}
                            >
                                <input
                                    type="file"
                                    id="image-upload-input"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const files = Array.from(e.target.files);
                                            setSelectedFiles(prev => [...prev, ...files]);
                                        }
                                    }}
                                />
                                <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-teal-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-sm font-medium text-slate-700">Drag & drop or <span className="text-teal-500 underline">browse</span></div>
                                <div className="text-xs text-slate-400">Support JPEG, PNG, WEBP (Max 10 files)</div>
                            </div>
                            {selectedFiles.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-3">
                                    {selectedFiles.map((file, idx) => {
                                        const url = URL.createObjectURL(file);
                                        return (
                                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                                <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-90 hover:opacity-100 hover:scale-105 transition-all shadow-sm"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                name="latitude"

                                value={formData.latitude}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white"
                                placeholder="e.g. 13.0827"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                name="longitude"

                                value={formData.longitude}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white"
                                placeholder="e.g. 80.2707"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100/60">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-serif font-bold text-slate-800">Operating Slots & Dynamic Pricing (₹)</label>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {SLOT_TIMES.map(slot => {
                                    const isActive = activeSlots[slot] ?? false;
                                    return (
                                        <div
                                            key={slot}
                                            className={`p-3.5 border rounded-2xl transition-all duration-300 flex flex-col justify-between space-y-3 ${isActive
                                                ? 'border-teal-200 bg-teal-50/10 shadow-sm'
                                                : 'border-slate-200 bg-slate-50/30 opacity-70'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">{slot}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={isActive}
                                                    onChange={(e) => {
                                                        setActiveSlots(prev => ({
                                                            ...prev,
                                                            [slot]: e.target.checked
                                                        }));
                                                    }}
                                                    className="w-4 h-4 text-teal-500 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                                                />
                                            </div>
                                            {isActive ? (
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        value={formData.slotPrices[slot] || ''}
                                                        onChange={(e) => handleSlotPriceChange(slot, e.target.value)}
                                                        className="w-full pl-7 pr-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm text-sm font-semibold text-slate-700"
                                                        placeholder="1200"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 font-medium italic py-2 text-center bg-slate-100/50 rounded-xl">
                                                    Not Operating
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2 pt-4 border-t border-slate-100/60">
                            <label className="text-sm font-medium text-slate-600 block ml-1">Amenities <span className="text-slate-400 font-normal">(comma separated)</span></label>
                            <input
                                type="text"
                                name="amenities"

                                value={formData.amenities}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow shadow-sm focus:bg-white"
                                placeholder="e.g. Water, Changing Room, Washroom"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-3 bg-teal-50/40 p-5 border border-teal-100/50 rounded-2xl mt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="w-5 h-5 text-teal-500 rounded border-teal-200 focus:ring-teal-500 cursor-pointer transition-colors"
                            />
                            <div className="flex flex-col">
                                <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
                                    Enable Turf Listing
                                </label>
                                <span className="text-[11px] text-slate-500">Turf will be immediately active and bookable by customers upon saving.</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-slate-100/60">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3.5 rounded-full border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md"
                        >
                            Publish Turf
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
