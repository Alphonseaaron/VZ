import React from 'react';
import {
  TwitterShareButton,
  FacebookShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  TwitterIcon,
  FacebookIcon,
  TelegramIcon,
  WhatsappIcon,
} from 'react-share';
import { motion } from 'framer-motion';

interface ShareButtonProps {
  title: string;
  winAmount: number;
  gameType: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, winAmount, gameType }) => {
  const shareUrl = window.location.href;
  const shareText = `I just won $${winAmount.toFixed(2)} playing ${gameType} on VZ Gaming! 🎮 💰 #VZGaming #BigWin`;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex space-x-2"
    >
      <TwitterShareButton url={shareUrl} title={shareText}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>

      <FacebookShareButton url={shareUrl} quote={shareText}>
        <FacebookIcon size={32} round />
      </FacebookShareButton>

      <TelegramShareButton url={shareUrl} title={shareText}>
        <TelegramIcon size={32} round />
      </TelegramShareButton>

      <WhatsappShareButton url={shareUrl} title={shareText}>
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>
    </motion.div>
  );
};