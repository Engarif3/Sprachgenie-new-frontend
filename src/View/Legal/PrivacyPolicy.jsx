import LegalPageLayout, { H2, P, Ul } from "./LegalPageLayout";

const PrivacyPolicy = () => {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="August 5, 2026">
      <P>
        This Privacy Policy explains what personal data SprachGenie
        ("SprachGenie", "we", "us") collects when you use{" "}
        <strong>simplegerman.de</strong> (the "Service"), why we collect it,
        and what rights you have over it. SprachGenie is operated by:
      </P>
      <P>
        Md Arifur Rahman
        <br />
        Vettersstraße 52, 09126 Chemnitz, Germany
        <br />
        Email:{" "}
        <a
          href="mailto:arif.aust.eng@gmail.com"
          className="text-orange-500 hover:underline dark:text-orange-400"
        >
          arif.aust.eng@gmail.com
        </a>
      </P>

      <H2>1. Data We Collect</H2>
      <P>
        <strong>Account data.</strong> If you register, we store your name,
        email address, and a securely hashed password. If you sign in with a
        third-party provider, we store the identifiers that provider gives
        us.
      </P>
      <P>
        <strong>Authentication data.</strong> When you log in, we set two
        strictly necessary, httpOnly session cookies (an access token and a
        refresh token) so you stay signed in. These cookies are not used for
        advertising or tracking.
      </P>
      <P>
        <strong>Visitor and analytics data.</strong> For every visit, we
        record your IP address, browser, operating system, device type, and
        an approximate location derived from your network (city/region
        level). We do not request your device's precise GPS location. This
        data is deleted automatically after 30 days of inactivity from that
        visitor.
      </P>
      <P>
        <strong>Content you create.</strong> Favorites, quiz and challenge
        results, learning progress, and any mistake reports you submit
        (including the reported sentence/word and your optional note) are
        stored against your account so we can act on them and show you your
        own history.
      </P>
      <P>
        <strong>AI-assisted features.</strong> When you use AI-generated
        practice paragraphs, story generation, or conjugation help, the
        relevant word or verb (and, where applicable, your report notes) is
        sent to the Google Gemini API to generate a response. Google
        processes this data as our sub-processor under its own terms.
      </P>
      <P>
        <strong>Transactional email.</strong> We send account-related emails
        (email verification, password reset) via Gmail SMTP to the address
        you registered with.
      </P>

      <H2>2. Why We Process This Data</H2>
      <Ul>
        <li>To create and secure your account, and keep you signed in.</li>
        <li>To provide the learning features you request (vocabulary,
          grammar, stories, conversations, AI practice, quizzes).</li>
        <li>To detect abuse, fraud, and bot traffic, and to keep basic usage
          analytics.</li>
        <li>To review and act on mistake reports you or other users submit.
        </li>
        <li>To send you account-related emails you've asked for.</li>
      </Ul>
      <P>
        The legal basis for this processing is performance of a contract
        (Art. 6(1)(b) GDPR) for account and learning features, and our
        legitimate interest in keeping the Service secure and reliable (Art.
        6(1)(f) GDPR) for visitor/analytics data.
      </P>

      <H2>3. Cookies &amp; Local Storage</H2>
      <P>
        We use strictly necessary cookies for authentication (see above) and
        browser local storage to remember your theme (light/dark) and
        language preference. We do not use third-party advertising or
        cross-site tracking cookies.
      </P>

      <H2>4. Sharing &amp; Sub-processors</H2>
      <P>
        We do not sell your data. We share limited data with the following
        service providers, strictly to operate the Service:
      </P>
      <Ul>
        <li>
          <strong>Google (Gemini API)</strong> — processes text you submit to
          AI-assisted features.
        </li>
        <li>
          <strong>Google (Gmail SMTP)</strong> — delivers transactional
          emails.
        </li>
        <li>
          <strong>Cloud hosting and database providers</strong> — host the
          application and store data described in this policy.
        </li>
      </Ul>
      <P>
        Some of these providers may process data outside the European
        Economic Area (e.g. in the United States). Where that happens, we
        rely on the provider's own GDPR-compliant safeguards, such as
        Standard Contractual Clauses.
      </P>

      <H2>5. Data Retention</H2>
      <P>
        Account data is kept for as long as your account is active. Signup
        security metadata (IP, device, approximate location) is kept for up
        to 30 days and is then automatically deleted, and is
        access-restricted to authorized admins while it exists. General
        visitor/analytics data (see Section 1) is likewise deleted
        automatically after 30 days of inactivity from that visitor. You can
        request deletion of your account and associated data at any time
        (see Section 6).
      </P>

      <H2>6. Your Rights</H2>
      <P>Under the GDPR, you have the right to:</P>
      <Ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Request deletion of your account and data.</li>
        <li>Restrict or object to certain processing.</li>
        <li>Receive your data in a portable format.</li>
        <li>Withdraw consent at any time, where processing is based on
          consent.</li>
        <li>
          Lodge a complaint with your local data protection supervisory
          authority.
        </li>
      </Ul>
      <P>
        To exercise any of these rights, email us at{" "}
        <a
          href="mailto:arif.aust.eng@gmail.com"
          className="text-orange-500 hover:underline dark:text-orange-400"
        >
          arif.aust.eng@gmail.com
        </a>
        .
      </P>

      <H2>7. Children's Privacy</H2>
      <P>
        The Service is not directed at children under 16. If you believe a
        child has provided us with personal data without appropriate
        consent, please contact us and we will delete it.
      </P>

      <H2>8. Security</H2>
      <P>
        We use industry-standard measures — password hashing, httpOnly
        session cookies, and access-restricted admin tooling — to protect
        your data. No online service can guarantee absolute security.
      </P>

      <H2>9. Changes to This Policy</H2>
      <P>
        We may update this policy as the Service evolves. Material changes
        will be reflected by updating the "Last updated" date above.
      </P>

      <H2>10. Contact</H2>
      <P>
        Questions about this policy? Email{" "}
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
          jurisdiction, please have this policy reviewed by a qualified
          lawyer.
        </em>
      </P>
    </LegalPageLayout>
  );
};

export default PrivacyPolicy;
