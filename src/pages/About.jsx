import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const teamMembers = [
  {
    name: "Dr. Elena Vance",
    role: "Chief Neuroscientist",
    description:
      "Expert in neural oscillation patterns and emotional feedback loops.",
    icon: "EV",
  },
  {
    name: "Julian Thorne",
    role: "Head of Experience",
    description:
      "Pioneer in ergonomic experience interfaces and human-centric UI.",
    icon: "JT",
  },
  {
    name: "Marcus Chen",
    role: "Technical Architect",
    description:
      "Specializes in high-performance bio-data processing and secure systems.",
    icon: "MC",
  },
  {
    name: "Sarah Jenkins",
    role: "Clinical Lead",
    description:
      "Ensuring every digital interaction adheres to the highest psychological standards.",
    icon: "SJ",
  },
];

function About() {
  return (
    <div className="min-h-screen bg-[#111414] text-white">
      <Navbar />

      <main className="px-6 py-16">
        {/* Mission */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex rounded-full border border-[#3a3645] bg-[#201d27] px-3 py-1">
            <span className="text-[8px] tracking-[1.5px] text-[#a69db8]">
              OUR MISSION
            </span>
          </div>

          <h1 className="font-serif text-4xl font-medium leading-tight text-[#dce4e2] md:text-5xl">
            Bridging Technology and
            <br />
            Empathy
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xs leading-6 text-[#899595] md:text-sm">
            MindSense is a clinical neuro-tech initiative dedicated to creating
            digital sanctuaries for mental well-being. We combine high-precision
            diagnostic tools with compassionate interface design to provide a
            safe space where data meets human understanding. Our project focuses
            on real-time emotional resonance tracking and personalized cognitive
            therapy paths.
          </p>

          {/* Principles */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-[8px] text-[#58d9d0]">
            <span>▣ Evidence Based</span>
            <span>◈ Privacy First</span>
            <span>✦ Neuro-Centric</span>
          </div>
        </section>

        {/* Team */}
        <section className="mx-auto mt-20 max-w-[850px]">
          <div className="text-center">
            <h2 className="font-serif text-2xl text-[#dce4e2]">
              The Minds Behind Sense
            </h2>

            <div className="mx-auto mt-3 h-px w-12 bg-[#58d9d0]" />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="rounded-md border border-[#293535] bg-[#191e1e] px-5 py-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#3b7774]"
              >
                {/* Profile */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#58d9d0]/50 bg-[#203635] font-serif text-lg text-[#58d9d0]">
                  {member.icon}
                </div>

                <h3 className="mt-5 font-serif text-base text-[#dce4e2]">
                  {member.name}
                </h3>

                <p className="mt-2 text-[9px] font-semibold text-[#58d9d0]">
                  {member.role}
                </p>

                <p className="mt-3 text-[9px] leading-4 text-[#899595]">
                  {member.description}
                </p>

                {/* Card actions */}
                <div className="mt-5 flex justify-center gap-4 text-[10px] text-[#697473]">
                  <button className="transition-colors hover:text-[#58d9d0]">
                    ↗
                  </button>

                  <button className="transition-colors hover:text-[#58d9d0]">
                    ♧
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;
