'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PasscodeVerificationProps {
  onVerify: (verified: boolean) => void;
}

export function PasscodeVerification({ onVerify }: PasscodeVerificationProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (passcode === '123456') {
      onVerify(true);
      setError('');
    } else {
      setError('访问码不正确，请重试');
      setPasscode('');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6 text-center">
      <div className="space-y-4">
        <Input
          type="password"
          placeholder="在此处填写访问码"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <Button 
          className="w-full" 
          onClick={handleVerify}
        >
          确认
        </Button>
      </div>
    </div>
  );
}
