import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface ScrollingHeadlineProps {
  enabled?: boolean;
  text?: string;
  link?: string;
  linkText?: string;
  isFlashSale?: boolean;
}

export function ScrollingHeadline({
  enabled = true,
  text,
  link,
  linkText,
  isFlashSale = false
}: ScrollingHeadlineProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { settings } = useSettings();

  // Get headlines from settings or use empty array
  const headlines = settings?.headlines || [];

  // Don't show if disabled, not visible, and no dynamic text OR no headlines
  if (!enabled || !isVisible || (!text && headlines.length === 0)) return null;

  return (
    <div className={cn(
      "relative overflow-hidden shadow-sm border-b transition-all duration-500",
      isFlashSale 
        ? "bg-slate-900 text-white border-slate-800 py-1" 
        : "bg-white text-blue-900 border-blue-100"
    )}>
      <div className="container mx-auto px-4 py-2 flex items-center gap-4">
        {/* Updates Badge */}
        <div className="shrink-0 flex items-center gap-2">
          <Badge className={cn(
            "gap-1.5 shadow-md transition-all",
            isFlashSale ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-primary text-white hover:bg-primary/90"
          )}>
            <Zap className={cn("h-3.5 w-3.5", isFlashSale ? "fill-white" : "fill-white")} />
            <span className="font-semibold text-[10px] uppercase tracking-wider">
              {isFlashSale ? 'Flash Sale' : 'Updates'}
            </span>
          </Badge>
          {isFlashSale && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-red-400 border border-white/5 uppercase tracking-tighter">
              <Clock className="h-3 w-3" /> Ends in 02:45:10
            </div>
          )}
        </div>

        {/* Scrolling Content */}
        <div className="flex-1 overflow-hidden">
          <div className="animate-scroll-left whitespace-nowrap flex">
            {text ? (
              <div className="flex items-center">
                <span className={cn(
                  "text-sm font-bold px-8 inline-block tracking-tight",
                  isFlashSale ? "text-white" : "text-slate-800"
                )}>
                  {text}
                </span>
                {link && (
                  <Link to={link || "#"} className={cn(
                    "text-sm font-black hover:underline ml-[-20px] mr-8 transition-colors",
                    isFlashSale ? "text-yellow-400 hover:text-yellow-300" : "text-primary"
                  )}>
                    {linkText || 'Claim Offer'}
                  </Link>
                )}
              </div>
            ) : (
              [...headlines, ...headlines].map((headline, index) => (
                <span
                  key={index}
                  className={cn(
                    "text-sm font-bold px-8 inline-block transition-colors tracking-tight",
                    isFlashSale ? "text-white/95" : "text-gray-800"
                  )}
                >
                  {isFlashSale && "🔥 "}
                  {headline}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className={cn(
            "shrink-0 h-6 w-6 transition-colors",
            isFlashSale ? "text-white/40 hover:text-white" : "text-gray-500 hover:text-gray-700"
          )}
          aria-label="Close announcement"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
