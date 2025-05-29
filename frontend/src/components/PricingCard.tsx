import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button, ButtonProps } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export interface Props {
  title: string;
  description: string;
  monthlyPrice: number;
  features: { icon: React.ElementType; text: string }[];
  isAnnual: boolean;
  isPopular?: boolean;
  ctaText: string;
  ctaVariant?: ButtonProps["variant"];
  onCtaClick: () => void;
  className?: string;
}

// Helper function to calculate annual price monthly equivalent
const calculateAnnualMonthlyEquivalent = (monthlyPrice: number) => {
  return monthlyPrice * 12 * 0.8 / 12; // Annual price / 12
};

export const PricingCard = ({
  title,
  description,
  monthlyPrice,
  features,
  isAnnual,
  isPopular = false,
  ctaText,
  ctaVariant = "default",
  onCtaClick,
  className = "",
}: Props) => {
  const isFree = monthlyPrice === 0;
  const displayPrice = isAnnual && !isFree ? calculateAnnualMonthlyEquivalent(monthlyPrice) : monthlyPrice;
  const priceSuffix = isFree ? "" : "/month";
  const showSavings = isAnnual && !isFree;
  const priceText = isFree ? "Free" : `$${displayPrice.toFixed(2)}`;


  return (
    <Card
      className={`flex flex-col border-border ${isPopular ? "border-primary border-2 relative shadow-xl" : ""} ${className} transition-transform duration-300 ease-in-out transform hover:scale-[1.03] hover:border-primary`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">
          Most Popular
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="text-4xl font-bold pt-4">
          {priceText}
          {!isFree && <span className="text-lg font-normal text-muted-foreground">{priceSuffix}</span>}
        </div>
        {showSavings && (
            <p className="text-sm text-primary font-medium">Save 20% annually!</p>
        )}
         {!showSavings && monthlyPrice === 0 && (
            // Placeholder to maintain height consistency for free plan
             <p className="text-sm text-transparent font-medium">-</p>
         )}
         {!showSavings && monthlyPrice > 0 && (
            // Placeholder to maintain height consistency for paid plans monthly view
             <p className="text-sm text-transparent font-medium">-</p>
         )}
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2 text-muted-foreground">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <feature.icon className="w-4 h-4 text-primary" /> {feature.text}
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="p-6 pt-0">
        <Button variant={ctaVariant} className="w-full" onClick={onCtaClick}>
          {ctaText}
        </Button>
      </div>
    </Card>
  );
};
