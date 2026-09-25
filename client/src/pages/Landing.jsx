import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Lock,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { NumberTicker, Reveal } from "@/components/MagicEffects";
import { Navbar } from "@/components/Navbar";
import { SectionHeading } from "@/components/SectionHeading";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ActionLink, Eyebrow } from "@/components/ui/text-link";
import { DarkGrid, Section, SectionInner } from "@/components/ui/section";

const workflow = [
  {
    step: "01",
    title: "Upload a version",
    text: "Start with the CV you have. PDF, DOCX, or image files are welcome.",
  },
  {
    step: "02",
    title: "Read the evidence",
    text: "The workspace organizes the useful signals and makes uncertainty visible.",
  },
  {
    step: "03",
    title: "Choose a direction",
    text: "Match against a role, compare versions, and arrive with a sharper story.",
  },
];

const features = [
  {
    icon: FileText,
    number: "01",
    title: "See the signal",
    text: "Turn a dense CV into a structured read of skills, experience, projects, and the details that need another look.",
  },
  {
    icon: Target,
    number: "02",
    title: "Match with context",
    text: "Compare your evidence with a job description and understand the exact skills, keywords, and gaps behind the score.",
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Improve deliberately",
    text: "Get practical suggestions for your next version without letting a tool quietly overwrite your work.",
  },
];

const scoreBars = [
  { label: "Product thinking", value: 88 },
  { label: "Frontend systems", value: 76 },
  { label: "Data storytelling", value: 68 },
  { label: "Team leadership", value: 54 },
];

const proofPoints = [
  {
    icon: ShieldCheck,
    title: "Explainable results",
    text: "Every score is traceable to the text in your CV.",
  },
  {
    icon: Lock,
    title: "Your CV stays yours",
    text: "Documents are only sent to the API you configure.",
  },
];

function AnalysisPreview() {
  return (
    <div className="border border-hairline bg-canvas">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <p className="label-uppercase text-muted">Analysis preview</p>
        <p className="label-uppercase text-muted-soft">Illustrative</p>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone="muted" as="p">
              CV signal score
            </Eyebrow>
            <p className="mt-3 text-[56px] leading-[1.05] font-bold tabular-nums text-ink">
              <NumberTicker value={82} />
              <span className="text-[18px] font-light text-muted"> / 100</span>
            </p>
          </div>
          <p className="label-uppercase text-primary">Strong foundation</p>
        </div>

        <div className="mt-8 space-y-5">
          {scoreBars.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="font-light text-body">{item.label}</span>
                <span className="font-bold tabular-nums text-ink">
                  {item.value}%
                </span>
              </div>
              <div className="h-2 bg-surface-strong">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-l-2 border-primary bg-surface-soft p-4">
          <Eyebrow tone="primary" as="p">
            One useful next move
          </Eyebrow>
          <p className="mt-2 text-[14px] leading-[1.55] font-light text-body">
            Make your product impact measurable with a before-and-after result
            in the experience section.
          </p>
        </div>
      </div>
    </div>
  );
}

function MatchPreview() {
  return (
    <div className="grid gap-px border border-on-dark/15 bg-on-dark/15 lg:grid-cols-2">
      <div className="bg-surface-dark p-6 sm:p-8">
        <p className="label-uppercase text-on-dark-soft">
          Compatibility result
        </p>
        <h3 className="mt-3 text-[24px] leading-[1.25] font-bold text-on-dark">
          Senior product engineer
        </h3>
        <p className="mt-1.5 text-[14px] font-light text-on-dark-soft">
          Northstar · Remote
        </p>
        <p className="mt-8 text-[64px] leading-[1.05] font-bold tabular-nums text-on-dark">
          87<span className="text-[20px] font-light text-on-dark-soft">%</span>
        </p>
        <p className="mt-3 border-t border-on-dark/15 pt-4 text-[14px] leading-[1.55] font-light text-on-dark-soft">
          Your experience aligns on the core work. The remaining gap is evidence
          of the tooling this role calls out most often.
        </p>
      </div>
      <div className="grid gap-px bg-on-dark/15">
        <div className="bg-surface-dark p-6 sm:p-8">
          <p className="label-uppercase text-on-dark-soft">Strong matches</p>
          <p className="mt-3 text-[15px] leading-[1.55] font-light text-on-dark">
            React · Systems thinking · Discovery
          </p>
        </div>
        <div className="bg-surface-dark p-6 sm:p-8">
          <p className="label-uppercase text-on-dark-soft">Worth exploring</p>
          <p className="mt-3 text-[15px] leading-[1.55] font-light text-on-dark">
            TypeScript · Cloud delivery
          </p>
        </div>
        <div className="bg-surface-dark p-6 sm:p-8">
          <p className="label-uppercase text-on-dark-soft">Why this score?</p>
          <p className="mt-3 text-[15px] leading-[1.55] font-light text-on-dark">
            Keyword overlap, evidence strength, and role-specific requirements,
            reviewed together.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      {/* 01 · hero-band-dark — {spacing.section} rhythm, type {colors.on-dark}, one blue CTA */}
      <Section tone="dark" className="min-h-screen relative overflow-hidden">
        <DarkGrid />
        <SectionInner className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div>
            <Eyebrow tone="soft" className="mb-6">
              Career intelligence, without the guesswork
            </Eyebrow>
            <h1 className="max-w-3xl text-balance text-[44px] leading-[1.05] font-bold text-on-dark sm:text-[56px] lg:text-[64px]">
              Understand your CV. Match your career.
            </h1>
            <p className="mt-7 max-w-2xl text-[18px] leading-[1.55] font-light text-on-dark-soft">
              CV analysis and job compatibility in one workspace. See what is
              strong, what is missing, and what to improve next.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/register">
                  Analyze my CV{" "}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="onDark" asChild>
                <Link to="/jobs">
                  Try the job matcher{" "}
                  <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          {/* the render slot: one flat nested plate, never a grid of cards */}
          <div className="border border-on-dark/25 bg-surface-dark-elevated p-7 sm:p-8">
            <p className="label-uppercase text-on-dark-soft">
              Built to be interrogated
            </p>
            <dl className="mt-7 divide-y divide-on-dark/15">
              {proofPoints.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[24px_1fr] sm:gap-5"
                >
                  <Icon
                    className="h-5 w-5 text-on-dark"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-[16px] font-bold text-on-dark">
                      {title}
                    </dt>
                    <dd className="mt-2 text-[14px] leading-[1.55] font-light text-on-dark-soft">
                      {text}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </SectionInner>
      </Section>

      {/* 02 · how it works — canvas */}
      <Section id="how-it-works" tone="canvas">
        <SectionInner>
          <SectionHeading
            eyebrow="How it works"
            title="Three steps, no guesswork."
            description="A deliberate workflow: bring a document, read the evidence, decide where to go next."
          />
          <ol className="mt-14 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
            {workflow.map((item) => (
              <li key={item.step} className="bg-canvas p-7">
                <p className="text-[32px] leading-[1.1] font-bold tabular-nums text-primary">
                  {item.step}
                </p>
                <h3 className="mt-6 text-[20px] leading-[1.3] font-bold">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.55] font-light text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </SectionInner>
      </Section>

      {/* 03 · analysis — soft grey */}
      <Section id="analysis" tone="soft">
        <SectionInner className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Analysis"
              title="A read of the evidence, not a verdict."
              description="CVision turns a dense document into structured signals: skills, experience, projects, and the details that need another look."
            />
            <ul className="mt-8 space-y-4">
              {[
                "Category scores you can interrogate",
                "Extracted skills, education, and experience",
                "Recommendations you review, never automatic rewrites",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-hairline pb-4 text-[15px] leading-[1.55] font-light text-body"
                >
                  <span
                    className="mt-2.5 h-px w-4 shrink-0 bg-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-8 inline-flex min-h-11 items-center"
            >
              <ActionLink>Start an analysis</ActionLink>
            </Link>
          </div>
          <Reveal>
            <AnalysisPreview />
          </Reveal>
        </SectionInner>
      </Section>

      {/* 04 · job matching — navy */}
      <Section
        id="job-matching"
        tone="dark"
        className="relative overflow-hidden"
      >
        <DarkGrid />
        <SectionInner className="relative">
          <SectionHeading
            eyebrow="Job matching"
            title="Match with context."
            description="See which requirements your evidence already covers — and which ones are worth closing before you apply."
            onDark
          />
          <div className="mt-14">
            <MatchPreview />
          </div>
        </SectionInner>
      </Section>

      {/* 05 · features — canvas */}
      <Section tone="canvas">
        <SectionInner>
          <SectionHeading
            eyebrow="What you get"
            title="Built for clearer applications."
          />
          <div className="mt-14 space-y-px bg-hairline">
            {features.map(({ icon: Icon, number, title, text }) => (
              <div
                key={number}
                className="grid gap-5 bg-canvas p-7 sm:grid-cols-[72px_1fr] sm:gap-8"
              >
                <div>
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-[13px] font-bold tabular-nums text-muted-soft">
                    {number}
                  </p>
                </div>
                <div>
                  <h3 className="text-[22px] leading-[1.3] font-bold">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-[1.55] font-light text-muted">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionInner>
      </Section>

      {/* 06 · final CTA — plate */}
      <Section tone="card">
        <SectionInner className="text-center">
          <SectionHeading
            align="center"
            eyebrow="Get started"
            title="Read your CV like a strategist would."
            description="Upload a version, see the signals, and decide what to fix before the next application."
          />
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/register">
                Create your workspace{" "}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </SectionInner>
      </Section>

      <footer className="border-t border-hairline bg-canvas">
        <SectionInner className="flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div>
            <Logo />
            <p className="mt-4 text-[13px] font-light text-muted">
              Career intelligence for clearer applications.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-3"
            aria-label="Footer navigation"
          >
            <a
              href="#how-it-works"
              className="label-uppercase text-muted transition-colors hover:text-primary"
            >
              How it works
            </a>
            <a
              href="#analysis"
              className="label-uppercase text-muted transition-colors hover:text-primary"
            >
              Analysis
            </a>
            <a
              href="#job-matching"
              className="label-uppercase text-muted transition-colors hover:text-primary"
            >
              Job matching
            </a>
            <Link
              to="/login"
              className="label-uppercase text-muted transition-colors hover:text-primary"
            >
              Sign in
            </Link>
          </nav>
        </SectionInner>
      </footer>
    </div>
  );
}
