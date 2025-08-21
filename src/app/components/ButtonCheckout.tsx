// components/SubscribeButton.js
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';

interface SubscribeButtonProps {
  priceId: string;
  userId?: string;
}

export default function SubscribeButton({ priceId, userId }: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
        }),
      });

      const { url } = await response.json();
      
      // Chuyển hướng đến Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      className={`px-4 py-2 rounded w-full ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 cursor-pointer'} text-white`}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : 'Subscribe'}
    </Button>
  );
}