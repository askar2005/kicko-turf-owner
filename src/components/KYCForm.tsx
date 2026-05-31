import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, AlertCircle, Ban, ArrowRight } from 'lucide-react';

export default function KYCForm() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<string | null>(localStorage.getItem('kicko_kyc_status'));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        panNumber: '',
        email: '',
        phone: '',
        accountName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        bankName: '',
        addressLine1: '',
        city: '',
        state: '',
        pincode: '',
        confirmCorrect: false,
        authorizeRazorpay: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;
        if (name === 'panNumber' || name === 'ifscCode') {
            finalValue = value.toUpperCase();
        }
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));

        if (name === 'ifscCode' && finalValue.length >= 4) {
            if (finalValue.startsWith('SBIN')) setFormData(prev => ({ ...prev, bankName: 'State Bank of India' }));
            else if (finalValue.startsWith('HDFC')) setFormData(prev => ({ ...prev, bankName: 'HDFC Bank' }));
            else if (finalValue.startsWith('ICIC')) setFormData(prev => ({ ...prev, bankName: 'ICICI Bank' }));
            else setFormData(prev => ({ ...prev, bankName: 'Other Bank' }));
        } else if (name === 'ifscCode' && finalValue.length < 4) {
            setFormData(prev => ({ ...prev, bankName: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.panNumber.length < 5) {
            setError('Invalid PAN Number format (too short)');
            return;
        }
        if (formData.accountNumber !== formData.confirmAccountNumber) {
            setError('Bank Account numbers do not match');
            return;
        }
        if (formData.ifscCode.length < 4) {
            setError('Invalid IFSC Code format (too short)');
            return;
        }
        if (!formData.confirmCorrect || !formData.authorizeRazorpay) {
            setError('Please accept all consent checkboxes');
            return;
        }

        setIsSubmitting(true);

        try {
            await new Promise(res => setTimeout(res, 1500));

            localStorage.setItem('kicko_kyc_status', 'APPROVED');
            localStorage.setItem('kicko_razorpay_account_id', 'acc_' + Math.random().toString(36).substr(2, 9));

            setFormData(prev => ({
                ...prev,
                panNumber: 'XXXXX' + prev.panNumber.slice(-4),
                accountNumber: '',
                confirmAccountNumber: ''
            }));

            setStatus('APPROVED');
        } catch (err) {
            setError('Failed to submit KYC details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-rose-50 via-teal-50 to-indigo-50 flex flex-col items-center justify-center p-6 text-slate-800 text-center font-sans">
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 max-w-md w-full flex flex-col items-center">
                    {status === 'APPROVED' && <CheckCircle2 className="w-20 h-20 text-teal-400 mb-6" />}
                    {status === 'UNDER_REVIEW' && <Clock className="w-20 h-20 text-yellow-400 mb-6" />}
                    {status === 'REJECTED' && <XCircle className="w-20 h-20 text-rose-400 mb-6" />}
                    {status === 'NEEDS_CLARIFICATION' && <AlertCircle className="w-20 h-20 text-orange-400 mb-6" />}
                    {status === 'SUSPENDED' && <Ban className="w-20 h-20 text-slate-400 mb-6" />}

                    <h1 className="text-2xl font-serif font-medium mb-3 text-slate-800">Status: <span className="text-teal-600">{status.replace('_', ' ')}</span></h1>
                    <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                        {status === 'APPROVED' ? 'Your identity verification is complete. You can now access your full workspace.' : 'Your verification details are currently being processed or require attention.'}
                    </p>

                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3.5 px-8 rounded-full transition-all shadow-sm hover:shadow-md"
                    >
                        Enter Workspace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-teal-50 to-indigo-50 py-12 px-4 flex justify-center font-sans">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif text-slate-800 mb-2">Complete Verification</h1>
                    <p className="text-slate-500 text-sm">Securely submit your details to activate payments</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {error && <div className="bg-rose-50/80 backdrop-blur-sm text-rose-600 p-4 rounded-2xl text-sm border border-rose-100 flex items-center gap-3"><AlertCircle className="w-5 h-5" />{error}</div>}

                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
                        <h2 className="text-xl font-serif text-slate-800 mb-6 pb-4 border-b border-slate-100/60">Identity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Full Name *</label>
                                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">PAN Number *</label>
                                <input required type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border uppercase" placeholder="ABCDE1234F" autoComplete="off" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Email *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Phone *</label>
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
                        <h2 className="text-xl font-serif text-slate-800 mb-6 pb-4 border-b border-slate-100/60">Bank Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Account Holder Name *</label>
                                <input required type="text" name="accountName" value={formData.accountName} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">IFSC Code *</label>
                                <input required type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border uppercase" placeholder="SBIN0001234" autoComplete="off" />
                                {formData.bankName && <p className="text-xs text-teal-600 mt-2 ml-1 font-medium">{formData.bankName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Bank Account Number *</label>
                                <input required type="password" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Confirm Account Number *</label>
                                <input required type="text" name="confirmAccountNumber" value={formData.confirmAccountNumber} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
                        <h2 className="text-xl font-serif text-slate-800 mb-6 pb-4 border-b border-slate-100/60">Address</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Address Line 1 *</label>
                                <input required type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">City *</label>
                                    <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">State *</label>
                                    <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Pincode *</label>
                                    <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full border-slate-200 bg-white/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-200 outline-none transition-shadow border" autoComplete="off" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
                        <h2 className="text-xl font-serif text-slate-800 mb-6 pb-4 border-b border-slate-100/60">Consent</h2>
                        <div className="space-y-4 p-5 bg-teal-50/30 border border-teal-100/50 rounded-2xl">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input required type="checkbox" name="confirmCorrect" checked={formData.confirmCorrect} onChange={handleChange} className="mt-1 w-5 h-5 text-teal-500 rounded border-teal-200 focus:ring-teal-500 transition-colors" />
                                <span className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-800 transition-colors">I confirm that all the details provided above are correct to the best of my knowledge.</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input required type="checkbox" name="authorizeRazorpay" checked={formData.authorizeRazorpay} onChange={handleChange} className="mt-1 w-5 h-5 text-teal-500 rounded border-teal-200 focus:ring-teal-500 transition-colors" />
                                <span className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-800 transition-colors">I authorize the platform to create a Razorpay sub-merchant account on my behalf for facilitating payments.</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button disabled={isSubmitting} type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-4 rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md flex items-center justify-center gap-2">
                            {isSubmitting ? 'Processing...' : 'Submit Verification'}
                            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
