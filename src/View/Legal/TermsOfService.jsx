import LegalPageLayout, { H2, P, Ul } from "./LegalPageLayout";

const TermsOfService = () => {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="August 5, 2026">
      <P>
        These Terms of Service ("Terms") govern your use of SprachGenie
        (<strong>simplegerman.de</strong>, the "Service"), operated by Md
        Arifur Rahman ("we", "us"). By creating an account or using the
        Service, you agree to these Terms.
      </P>

      <H2>1. The Service</H2>
      <P>
        SprachGenie is a German-language learning platform offering
        vocabulary, grammar explanations, conversations, stories, quizzes,
        challenges, and AI-assisted practice content. Features and content
        may change, be added, or be removed at any time without notice.
      </P>

      <H2>2. Accounts</H2>
      <Ul>
        <li>You must provide accurate information when registering.</li>
        <li>
          You are responsible for keeping your login credentials
          confidential and for all activity under your account.
        </li>
        <li>
          You must be old enough to legally consent to online services in
          your country. The Service is not directed at children under 16.
        </li>
        <li>
          We may suspend or terminate accounts that violate these Terms or
          are used for abuse, fraud, or automated scraping.
        </li>
      </Ul>

      <H2>3. Acceptable Use</H2>
      <P>You agree not to:</P>
      <Ul>
        <li>
          Use automated tools to scrape, bulk-download, or overload the
          Service.
        </li>
        <li>Attempt to bypass authentication, rate limits, or access
          controls.</li>
        <li>
          Upload or submit content (including mistake reports) that is
          unlawful, abusive, or infringes on others' rights.
        </li>
        <li>Reverse-engineer or resell access to the Service.</li>
      </Ul>

      <H2>4. User-Submitted Content</H2>
      <P>
        Some features let you submit content — such as mistake reports on
        words, sentences, or grammar explanations. By submitting content, you
        grant us a non-exclusive, royalty-free license to use it to review,
        correct, and improve the Service. You're responsible for making sure
        your submissions don't infringe on anyone else's rights.
      </P>

      <H2>5. AI-Generated Content</H2>
      <P>
        Certain features (practice paragraphs, story generation, conjugation
        help) are generated with the help of a third-party AI model. AI
        output may occasionally be inaccurate, incomplete, or contain errors
        typical of automated language generation. Use it as a learning aid,
        not as an authoritative source, and please report mistakes you find
        using the built-in report tools.
      </P>

      <H2>6. Intellectual Property</H2>
      <P>
        The Service's design, code, and original content are owned by
        SprachGenie unless otherwise noted. Vocabulary and grammar reference
        material may be adapted from publicly available learning resources
        for educational purposes. You may not copy, redistribute, or
        commercially exploit the Service's content without permission.
      </P>

      <H2>7. Third-Party Links &amp; Content</H2>
      <P>
        The Service may link to or embed third-party content (for example,
        radio streams). We don't control and aren't responsible for
        third-party content, availability, or practices.
      </P>

      <H2>8. Disclaimer of Warranties</H2>
      <P>
        The Service is provided "as is" and "as available," without
        warranties of any kind, express or implied, including accuracy,
        availability, or fitness for a particular purpose. We don't guarantee
        the Service will be uninterrupted or error-free.
      </P>

      <H2>9. Limitation of Liability</H2>
      <P>
        To the maximum extent permitted by law, SprachGenie and its operator
        are not liable for indirect, incidental, or consequential damages
        arising from your use of the Service. Nothing in these Terms limits
        liability that cannot be excluded under applicable law (such as
        liability for intent or gross negligence).
      </P>

      <H2>10. Termination</H2>
      <P>
        You may stop using the Service and request account deletion at any
        time. We may suspend or terminate your access for violating these
        Terms.
      </P>

      <H2>11. Changes to These Terms</H2>
      <P>
        We may update these Terms as the Service evolves. Continued use of
        the Service after changes take effect means you accept the updated
        Terms. Material changes will be reflected by updating the "Last
        updated" date above.
      </P>

      <H2>12. Governing Law</H2>
      <P>
        These Terms are governed by the laws of the Federal Republic of
        Germany, without regard to conflict-of-law principles, to the extent
        permitted by applicable consumer-protection law in your country of
        residence.
      </P>

      <H2>13. Contact</H2>
      <P>
        Questions about these Terms? Email{" "}
        <a
          href="mailto:arif.aust.eng@gmail.com"
          className="text-orange-500 hover:underline dark:text-orange-400"
        >
          arif.aust.eng@gmail.com
        </a>
        .
      </P>

      <P>
        <em>
          This page is provided for general informational purposes and is not
          legal advice. If SprachGenie is offered commercially in your
          jurisdiction, please have these Terms reviewed by a qualified
          lawyer.
        </em>
      </P>
    </LegalPageLayout>
  );
};

export default TermsOfService;
