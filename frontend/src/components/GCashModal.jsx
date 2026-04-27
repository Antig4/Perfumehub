import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ShieldCheck, CheckCircle2, Info, Smartphone, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function GCashModal({ open, onClose, onSuccess, amount }) {
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(28);
  const [showDetails, setShowDetails] = useState(false);

  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setMobileNumber('');
      setOtp(['', '', '', '']);
      setLoading(false);
      setTimer(28);
      setShowDetails(false);
    }
  }, [open]);

  // Auto-fill OTP after 2 seconds on Step 2
  useEffect(() => {
    if (step === 2) {
      const autoFillTimer = setTimeout(() => {
        setOtp(['1', '2', '3', '4']);
      }, 2000);
      return () => clearTimeout(autoFillTimer);
    }
  }, [step]);

  // Timer countdown for Step 2
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!open) return null;

  const handleNext = (e) => {
    e.preventDefault();
    if (mobileNumber.length < 10) return; // Basic validation
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setTimer(28);
    }, 800);
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (otp.some(digit => digit === '')) return; // Validate all OTP fields filled
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleDone = () => {
    onSuccess(); // Triggers the actual order creation
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Keep only last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const formatAmount = (val) => Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const refNumber = `GCASH-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col relative font-sans">
        
        {/* Header */}
        <div className="bg-[#005CE6] text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="mr-3 hover:bg-white/20 p-1 rounded-full transition">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center font-bold text-xl tracking-tight">
              {/* Fake GCash Logo SVG */}
              <svg className="w-6 h-6 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M12 15a3 3 0 003-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              GCash
            </div>
          </div>
          {step !== 3 && (
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col items-center bg-white h-[500px] overflow-y-auto">
          
          {step === 1 && (
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-[#1A1A1A] font-bold text-xl mb-1">Pay with GCash</h2>
                <p className="text-[#666666] text-sm">Enter your GCash mobile number to continue.</p>
              </div>

              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-[#E5F0FF] rounded-2xl flex items-center justify-center relative">
                  <Smartphone className="w-12 h-12 text-[#005CE6]" />
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5">
                    <CheckCircle2 className="w-7 h-7 text-[#005CE6] fill-white" />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[#1A1A1A] font-bold text-sm mb-2">GCash Mobile Number</label>
                <div className="flex rounded-lg border border-[#CCCCCC] overflow-hidden focus-within:border-[#005CE6] focus-within:ring-1 focus-within:ring-[#005CE6] transition-colors">
                  <div className="bg-[#F5F5F5] px-4 py-3 border-r border-[#CCCCCC] text-[#1A1A1A] font-medium flex items-center">
                    +63
                  </div>
                  <input 
                    type="tel" 
                    placeholder="9XX XXX XXXX" 
                    className="w-full px-4 py-3 outline-none text-[#1A1A1A] font-medium tracking-wide placeholder:text-[#999999]"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoFocus
                  />
                </div>
                <p className="text-[#666666] text-xs mt-2">We'll send a 4-digit OTP to your number.</p>
              </div>

              <div className="bg-[#F5F8FC] rounded-xl p-4 mb-6">
                <p className="text-[#1A1A1A] font-bold text-sm mb-3">Amount to Pay</p>
                <div className="flex justify-between items-end">
                  <span className="text-[#666666] text-sm font-medium">PHP</span>
                  <span className="text-[#1A1A1A] font-bold text-2xl">{formatAmount(amount)}</span>
                </div>
                <p className="text-[#666666] text-xs mt-2">Perfume Order #ORD-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                <button onClick={() => setShowDetails(!showDetails)} className="text-[#005CE6] text-sm font-bold mt-3 flex items-center">
                  View Details <ChevronLeft className={`w-4 h-4 ml-1 transition-transform ${showDetails ? 'rotate-[90deg]' : 'rotate-[-90deg]'}`} />
                </button>
                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-[#E5E5E5] space-y-1">
                    <div className="flex justify-between text-xs text-[#666666]">
                      <span>Subtotal</span>
                      <span>PHP {formatAmount(amount - 100)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#666666]">
                      <span>Shipping Fee</span>
                      <span>PHP 100.00</span>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleNext}
                disabled={loading || mobileNumber.length < 10}
                className="w-full bg-[#005CE6] hover:bg-[#004BBF] disabled:bg-[#CCCCCC] disabled:text-[#999999] text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'NEXT'}
              </button>
              
              <div className="flex items-start justify-center gap-2 mt-6 text-center">
                <ShieldCheck className="w-4 h-4 text-[#005CE6] shrink-0 mt-0.5" />
                <p className="text-[#666666] text-xs">
                  Your payment is 100% secure.<br/>
                  GCash protects your privacy and data.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-[#1A1A1A] font-bold text-xl mb-1">Enter OTP</h2>
                <p className="text-[#666666] text-sm">We sent a 4-digit code to</p>
                <p className="text-[#005CE6] font-bold text-sm mt-0.5">09{mobileNumber.substring(1, 3)} {mobileNumber.substring(3, 6)} {mobileNumber.substring(6)}</p>
              </div>

              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 flex items-center justify-center">
                  <Mail className="w-16 h-16 text-[#4D94FF] fill-[#E5F0FF]" strokeWidth={1} />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[#1A1A1A] font-bold text-sm mb-3">Enter the 4-digit OTP</label>
                <div className="flex justify-between gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="tel"
                      className="w-14 h-14 border border-[#CCCCCC] rounded-xl text-center text-2xl font-bold text-[#1A1A1A] focus:border-[#005CE6] focus:ring-1 focus:ring-[#005CE6] outline-none transition-all"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <p className="text-[#666666] text-sm mt-4">
                  Didn't get the code? <span className={`font-bold ${timer > 0 ? 'text-[#999999]' : 'text-[#005CE6] cursor-pointer'}`}>Resend OTP {timer > 0 && `(${timer}s)`}</span>
                </p>
              </div>

              <div className="bg-[#F5F8FC] rounded-xl p-4 mb-6">
                <p className="text-[#1A1A1A] font-bold text-sm mb-3">Amount to Pay</p>
                <div className="flex justify-between items-end">
                  <span className="text-[#666666] text-sm font-medium">PHP</span>
                  <span className="text-[#1A1A1A] font-bold text-2xl">{formatAmount(amount)}</span>
                </div>
                <button onClick={() => setShowDetails(!showDetails)} className="text-[#005CE6] text-sm font-bold mt-3 flex items-center">
                  View Details <ChevronLeft className={`w-4 h-4 ml-1 transition-transform ${showDetails ? 'rotate-[90deg]' : 'rotate-[-90deg]'}`} />
                </button>
                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-[#E5E5E5] space-y-1">
                    <div className="flex justify-between text-xs text-[#666666]">
                      <span>Subtotal</span>
                      <span>PHP {formatAmount(amount - 100)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#666666]">
                      <span>Shipping Fee</span>
                      <span>PHP 100.00</span>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handlePay}
                disabled={loading || otp.some(d => d === '')}
                className="w-full bg-[#005CE6] hover:bg-[#004BBF] disabled:bg-[#CCCCCC] disabled:text-[#999999] text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : `PAY PHP ${formatAmount(amount)}`}
              </button>
              
              <div className="flex items-start justify-center gap-2 mt-6 text-center">
                <ShieldCheck className="w-4 h-4 text-[#005CE6] shrink-0 mt-0.5" />
                <p className="text-[#666666] text-xs">
                  Your payment is 100% secure.<br/>
                  GCash protects your privacy and data.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full flex flex-col h-full animate-in zoom-in-95 duration-500">
              <div className="flex-1">
                <div className="flex justify-center mb-6 mt-4 relative">
                  {/* Confetti or spark effect could go here */}
                  <div className="w-20 h-20 bg-[#2BCA5A] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(43,202,90,0.4)]">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-[#2BCA5A] font-bold text-xl mb-2">Payment Successful!</h2>
                  <p className="text-[#1A1A1A] text-sm max-w-[250px] mx-auto leading-relaxed">
                    Your payment was successfully processed via GCash.
                  </p>
                </div>

                <div className="space-y-4 text-sm px-2 border-t border-b border-[#EEEEEE] py-6 mb-6">
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Amount Paid</span>
                    <span className="text-[#1A1A1A] font-bold">PHP {formatAmount(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Date & Time</span>
                    <span className="text-[#1A1A1A]">{format(new Date(), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Reference No.</span>
                    <span className="text-[#1A1A1A] text-right font-medium">{refNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Payment Method</span>
                    <span className="text-[#1A1A1A]">GCash</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Mobile Number</span>
                    <span className="text-[#1A1A1A]">09{mobileNumber.substring(1, 3)} {mobileNumber.substring(3, 6)} {mobileNumber.substring(6)}</span>
                  </div>
                </div>

                <div className="bg-[#F0F5FF] rounded-lg p-4 flex gap-3">
                  <Info className="w-5 h-5 text-[#005CE6] shrink-0" />
                  <p className="text-[#1A1A1A] text-sm leading-snug">
                    You will receive an SMS confirmation shortly.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <button 
                  onClick={handleDone}
                  className="w-full bg-[#005CE6] hover:bg-[#004BBF] text-white font-bold py-3.5 rounded-full transition-colors"
                >
                  DONE
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
