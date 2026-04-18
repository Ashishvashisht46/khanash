import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/index.js';
import AppBrand from '../components/layout/AppBrand.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        {/* 404 display */}
        <div className="relative mb-6">
          <p className="font-brand text-[120px] font-bold text-gradient-gold leading-none opacity-20 select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="surface-card-soft flex h-24 items-center px-4 shadow-xl shadow-brand/10">
              <AppBrand />
            </div>
          </div>
        </div>

        <h1 className="font-brand text-2xl font-semibold text-text-primary mb-2">
          Page Not Found
        </h1>
        <p className="text-text-muted mb-8">
          The page you're looking for doesn't exist or you don't have permission to view it.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="md"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="gold"
            size="md"
            icon={Home}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
