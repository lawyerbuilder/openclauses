import Link from "next/link";

export const metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for SCG OpenClauses. Internal SCG Legal use only. No legal advice; no warranty; no liability.",
};

const LAST_UPDATED = "June 24, 2026";

export default function TermsPage() {
  return (
    <div className="container py-12 max-w-2xl">
      <p className="eyebrow mb-2">Legal</p>
      <h1 className="text-[2rem] font-semibold tracking-tight leading-tight">
        Terms of Use
      </h1>
      <p className="mt-2 text-sm text-muted-foreground tabular-nums">
        Last updated {LAST_UPDATED}
      </p>

      <div className="mt-8 surface p-5 sm:p-6">
        <div className="flex items-start gap-2.5 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <p>
            <strong className="font-semibold">SCG OpenClauses is provided for the internal use
            of personnel of Siam Cement Group ("SCG") and its affiliated entities</strong> —
            primarily lawyers and compliance professionals at SCG Legal. Access by others is
            unauthorized.
          </p>
        </div>
      </div>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">1. Acceptance</h2>
          <p>
            By accessing or using SCG OpenClauses (the <em>"Platform"</em>), you agree to these
            Terms of Use. If you do not agree, do not access or use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">2. Intended Users</h2>
          <p>
            The Platform is provided exclusively for the internal use of SCG personnel —
            primarily lawyers and compliance professionals at SCG Legal — for the purposes of
            legal research, drafting reference, and clause comparison. The Platform is not
            intended for use by external parties, clients, counterparties, or the general public.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">3. Nature of Content</h2>
          <p>
            The Platform indexes and reproduces clauses extracted from contracts publicly filed
            with the U.S. Securities and Exchange Commission (<em>"SEC"</em>) through the EDGAR
            system. All source documents are matters of public record. SCG OpenClauses does not
            warrant the accuracy, completeness, current applicability, or jurisdictional
            relevance of any clause, contract, or summary made available on the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">4. Not Legal Advice</h2>
          <p>
            <strong className="font-semibold">
              Nothing on the Platform constitutes legal advice, a legal opinion, or any form of
              recommendation.
            </strong>{" "}
            Clauses are provided for reference, research, and educational purposes only. You
            must always consult qualified counsel licensed in the relevant jurisdiction before
            drafting, relying on, or executing any contract provision found on or derived from
            the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">
            5. No Professional Relationship
          </h2>
          <p>
            Use of the Platform does not create any attorney-client, advisor-client, fiduciary,
            or professional relationship between any user and SCG, its affiliates, employees,
            contractors, contributors, or licensors. No information transmitted through the
            Platform is privileged or confidential as between any user and any party.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">6. No Warranty</h2>
          <p>
            <strong className="font-semibold uppercase tracking-wide text-foreground">
              The Platform is provided "as is" and "as available," without warranty of any kind,
              express or implied,
            </strong>{" "}
            including but not limited to warranties of merchantability, fitness for a particular
            purpose, accuracy, completeness, non-infringement, uninterrupted availability, or
            freedom from error. SCG makes no representation that any clause is suitable for any
            particular transaction or jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, in no event shall SCG, its
            affiliates, officers, directors, employees, contractors, contributors, or licensors
            be liable for any direct, indirect, incidental, special, consequential, punitive, or
            exemplary damages — including but not limited to loss of profits, loss of business,
            loss of data, or damages arising from reliance on any clause, summary, or content
            available on the Platform — whether based on warranty, contract, tort, statute, or
            any other legal theory, even if advised of the possibility of such damages.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">8. No Affiliation</h2>
          <p>
            SCG OpenClauses is not affiliated with, endorsed by, or sponsored by the U.S.
            Securities and Exchange Commission, Law Insider, or any commercial clause-library
            service, law firm, or third-party content provider. All third-party trademarks and
            company names remain the property of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">9. Third-Party Links</h2>
          <p>
            The Platform contains links to SEC EDGAR filings and other third-party resources. SCG
            does not control, endorse, or assume responsibility for the content, availability,
            accuracy, or practices of any third-party site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">
            10. Modification and Availability
          </h2>
          <p>
            The Platform, including its features, content, and these Terms, may be modified,
            suspended, or discontinued at any time and without notice. Continued use after any
            modification of these Terms constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">
            11. Acceptable Use
          </h2>
          <p>
            You shall not (a) use the Platform for any unlawful purpose; (b) attempt to bypass,
            disable, or interfere with any security or access-control feature; (c) automate
            access to the Platform in a manner that places undue burden on the underlying
            infrastructure; or (d) redistribute or resell access to the Platform to third
            parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">12. Open Source</h2>
          <p>
            The source code of the Platform is open source. Use of the source code is governed
            by the license accompanying the code repository. These Terms govern your use of the
            hosted Platform, not the source code itself.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">13. Governing Law</h2>
          <p>
            These Terms and any dispute arising out of or relating to the Platform shall be
            governed by and construed in accordance with the laws of the Kingdom of Thailand,
            without regard to its conflict-of-laws principles. The parties consent to the
            exclusive jurisdiction of the courts of Bangkok, Thailand for any dispute that
            cannot be resolved informally.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">14. Severability</h2>
          <p>
            If any provision of these Terms is held to be invalid or unenforceable, the
            remaining provisions shall remain in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">15. Contact</h2>
          <p>
            Questions regarding these Terms or the Platform should be directed to{" "}
            <a
              href="mailto:abi.serrano@gmail.com"
              className="text-primary hover:underline font-medium"
            >
              abi.serrano@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline font-medium">
          ← Back to search
        </Link>
        <span className="mx-2 text-border">·</span>
        <Link href="/about" className="hover:text-foreground transition-colors">
          About
        </Link>
      </p>
    </div>
  );
}
