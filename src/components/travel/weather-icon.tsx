"use client";

import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Zap 
} from "lucide-react";

type WeatherIconProps = {
  code: number;
  className?: string;
  size?: number;
};

export function WeatherIcon({ code, className, size = 16 }: WeatherIconProps) {
  // Open-Meteo WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  
  if (code === 0) return <Sun className={className} size={size} />;
  if ([1, 2, 3].includes(code)) return <CloudSun className={className} size={size} />;
  if ([45, 48].includes(code)) return <Cloud className={className} size={size} />; // Fog
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className={className} size={size} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <Snowflake className={className} size={size} />;
  if ([95, 96, 99].includes(code)) return <Zap className={className} size={size} />;
  
  return <CloudSun className={className} size={size} />;
}
