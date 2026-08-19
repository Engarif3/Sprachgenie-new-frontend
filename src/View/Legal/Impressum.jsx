import LegalPageLayout, { H2, P } from "./LegalPageLayout";

const Impressum = () => {
  return (
    <LegalPageLayout title="Impressum" lastUpdated="August 5, 2026">
      <P>Information according to § 5 DDG (German Digital Services Act):</P>

      <P>
        Md Arifur Rahman
        <br />
        Vettersstraße 52
        <br />
        09126 Chemnitz, Germany
      </P>

      <H2>Contact</H2>
      <P>
        Email:{" "}
        <a
          href="mailto:arif.aust.eng@gmail.com"
          className="text-orange-500 hover:underline dark:text-orange-400"
        >
          arif.aust.eng@gmail.com
        </a>
      </P>

      <H2>Responsible for Content (§ 18 Abs. 2 MStV)</H2>
      <P>
        Md Arifur Rahman, address as above.
      </P>

      <H2>About This Project</H2>
      <P>
        SprachGenie (simplegerman.de) is an individually operated German
        language-learning platform. It is not a registered company; VAT
        identification is not applicable.
      </P>

      <H2>Dispute Resolution</H2>
      <P>
        We are not obligated and generally not willing to participate in
        dispute resolution proceedings before a consumer arbitration board.
      </P>

      <H2>Liability for Content</H2>
      <P>
        As a service provider, we are responsible for our own content on
        these pages under general law. However, we are not obligated to
        monitor transmitted or stored third-party information, or to
        investigate circumstances that indicate illegal activity. Obligations
        to remove or block the use of information under general law remain
        unaffected. Liability in this regard is only possible from the point
        in time at which a specific infringement of the law becomes known. If
        we become aware of any such legal infringements, we will remove the
        relevant content immediately.
      </P>

      <H2>Liability for Links</H2>
      <P>
        Our site contains links to external third-party websites (for
        example, radio streams) over whose content we have no control. We
        therefore cannot accept any liability for this external content. The
        respective provider or operator of the linked pages is always
        responsible for their content. A permanent content check of linked
        pages is not reasonable without concrete evidence of an infringement.
        Illegal links will be removed immediately upon becoming aware of
        them.
      </P>

      <H2>Copyright</H2>
      <P>
        Content and works created by the site operator on these pages are
        subject to German copyright law. Reproduction, editing,
        distribution, and any kind of exploitation outside the limits of
        copyright require the written consent of the respective author.
      </P>

      <P>
        <em>
          This page is provided in good faith to meet the § 5 DDG disclosure
          requirements and is not legal advice. If you have any doubt about
          your specific obligations, please consult a qualified lawyer.
        </em>
      </P>
    </LegalPageLayout>
  );
};

export default Impressum;
