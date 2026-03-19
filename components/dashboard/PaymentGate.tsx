import PaymentOptions from "@/components/PaymentOptions";

interface PaymentGateProps {
  tier?: string;
  memberName?: string;
}

export default function PaymentGate({
  tier = "individual",
  memberName,
}: PaymentGateProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header block */}
        <div className="bg-[#1A1A2E] rounded-t-2xl p-6 text-center border border-b-0 border-white/10">
          <div className="w-14 h-14 rounded-full bg-[#E8006A]/10 border border-[#E8006A]/30 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-[#E8006A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Complete Your Membership
          </h2>
          {memberName && (
            <p className="text-white/50 text-sm">Hi {memberName.split(" ")[0]},</p>
          )}
          <p className="text-white/60 text-sm mt-1 max-w-xs mx-auto">
            Choose a payment method to activate your WHVAC membership and access
            all member benefits.
          </p>
        </div>

        {/* Payment options — light variant */}
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-gray-200">
          <PaymentOptions tier={tier} variant="light" />
        </div>
      </div>
    </div>
  );
}
