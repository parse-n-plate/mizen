'use client';

interface TipsCardProps {
  tip: string;
}

export default function TipsCard({ tip }: TipsCardProps) {
  if (!tip) return null;

  return (
    <div className="bg-[#fffbeb] border border-[#fee685] rounded-[16px] px-5 py-5 flex flex-col gap-2.5">
      <h3 className="font-albert font-medium text-[18px] text-[#7b3306] leading-[28px]">
        💡 Tip
      </h3>
      <p className="font-albert text-[16px] text-[#973c00] leading-[26px]">
        {tip}
      </p>
    </div>
  );
}







