function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-md border border-[#293535] bg-[#191e1e] p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#3b7774]">
      <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#203635] text-[#58d9d0]">
        {icon}
      </div>

      <h3 className="font-serif text-lg text-[#dce4e2]">
        {title}
      </h3>

      <p className="mt-3 text-xs leading-5 text-[#899595]">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
