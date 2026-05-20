import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Practa AI',
  description: 'Privacy Policy for Practa AI - AI-powered sales training platform',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#070b0a]">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="prose prose-invert prose-emerald max-w-none">
          <h1 className="text-3xl font-bold text-white mb-2">PRIVACY POLICY</h1>
          <p className="text-white/60 text-sm mb-8">Last updated May 19, 2026</p>

          <div className="space-y-6 text-white/80">
            <p>
              This Privacy Notice for <strong className="text-white">Niko Tadic</strong> (doing business as <strong className="text-white">Practa AI</strong>) (
              <strong>"we," "us," or "our"</strong>), describes how and why we might access, collect, store, use, and/or share (
              <strong>"process"</strong>) your personal information when you use our services (<strong>"Services"</strong>
              ), including when you:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                Visit our website at{' '}
                <a href="https://practa-ai.vercel.app" className="text-emerald-400 hover:underline">
                  practa-ai.vercel.app
                </a>{' '}
                or any website of ours that links to this Privacy Notice
              </li>
              <li>
                Use <strong className="text-white">Practa AI</strong>. An AI-powered sales training platform where users
                practice realistic sales conversations with adaptive AI prospects. Users engage in text role-play sessions
                and get detailed post-call feedback on skills like discovery, objection handling, and closing.
              </li>
              <li>Engage with us in other related ways, including any marketing or events</li>
            </ul>

            <p>
              <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy
              rights and choices. We are responsible for making decisions about how your personal information is processed. If
              you do not agree with our policies and practices, please do not use our Services. If you still have any
              questions or concerns, please contact us at{' '}
              <a href="mailto:ntadic1804@icloud.com" className="text-emerald-400 hover:underline">
                ntadic1804@icloud.com
              </a>
              .
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">SUMMARY OF KEY POINTS</h2>

            <p className="text-white/60 italic">
              <strong>This summary provides key points from our Privacy Notice, but you can find out more details about any
              of these topics by clicking the link following each key point or by using our table of contents below to find
              the section you are looking for.</strong>
            </p>

            <div className="space-y-4">
              <p>
                <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we
                may process personal information depending on how you interact with us and the Services, the choices you
                make, and the products and features you use.{' '}
                <a href="#infocollect" className="text-emerald-400 hover:underline">
                  Learn more about personal information you disclose to us
                </a>
                .
              </p>

              <p>
                <strong>Do we process any sensitive personal information?</strong> Some of the information may be
                considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins,
                sexual orientation, and religious beliefs. <strong>We do not process sensitive personal information.</strong>
              </p>

              <p>
                <strong>Do we collect any information from third parties?</strong>{' '}
                <strong>We do not collect any information from third parties.</strong>
              </p>

              <p>
                <strong>How do we process your information?</strong> We process your information to provide, improve, and
                administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We
                may also process your information for other purposes with your consent. We process your information only
                when we have a valid legal reason to do so.{' '}
                <a href="#infouse" className="text-emerald-400 hover:underline">
                  Learn more about how we process your information
                </a>
                .
              </p>

              <p>
                <strong>In what situations and with which parties do we share personal information?</strong> We may share
                information in specific situations and with specific third parties.{' '}
                <a href="#whoshare" className="text-emerald-400 hover:underline">
                  Learn more about when and with whom we share your personal information
                </a>
                .
              </p>

              <p>
                <strong>How do we keep your information safe?</strong> We have adequate organizational and technical
                processes and procedures in place to protect your personal information. However, no electronic transmission
                over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise
                or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our
                security and improperly collect, access, steal, or modify your information.{' '}
                <a href="#infosafe" className="text-emerald-400 hover:underline">
                  Learn more about how we keep your information safe
                </a>
                .
              </p>

              <p>
                <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable
                privacy law may mean you have certain rights regarding your personal information.{' '}
                <a href="#privacyrights" className="text-emerald-400 hover:underline">
                  Learn more about your privacy rights
                </a>
                .
              </p>

              <p>
                <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by{' '}
                <a
                  href="https://app.termly.io/dsar/6a27cae7-b1a8-43dd-baee-8490204568fb"
                  className="text-emerald-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  submitting a data subject access request
                </a>
                , or by contacting us. We will consider and act upon any request in accordance with applicable data
                protection laws.
              </p>

              <p>
                Want to learn more about what we do with any information we collect?{' '}
                <a href="#toc" className="text-emerald-400 hover:underline">
                  Review the Privacy Notice in full
                </a>
                .
              </p>
            </div>

            <h2 id="toc" className="text-2xl font-bold text-white mt-8 mb-4">
              TABLE OF CONTENTS
            </h2>

            <ol className="list-decimal pl-6 space-y-1">
              <li>
                <a href="#infocollect" className="text-emerald-400 hover:underline">
                  WHAT INFORMATION DO WE COLLECT?
                </a>
              </li>
              <li>
                <a href="#infouse" className="text-emerald-400 hover:underline">
                  HOW DO WE PROCESS YOUR INFORMATION?
                </a>
              </li>
              <li>
                <a href="#legalbases" className="text-emerald-400 hover:underline">
                  WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?
                </a>
              </li>
              <li>
                <a href="#whoshare" className="text-emerald-400 hover:underline">
                  WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
                </a>
              </li>
              <li>
                <a href="#cookies" className="text-emerald-400 hover:underline">
                  DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
                </a>
              </li>
              <li>
                <a href="#ai" className="text-emerald-400 hover:underline">
                  DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?
                </a>
              </li>
              <li>
                <a href="#intltransfers" className="text-emerald-400 hover:underline">
                  IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?
                </a>
              </li>
              <li>
                <a href="#inforetain" className="text-emerald-400 hover:underline">
                  HOW LONG DO WE KEEP YOUR INFORMATION?
                </a>
              </li>
              <li>
                <a href="#infosafe" className="text-emerald-400 hover:underline">
                  HOW DO WE KEEP YOUR INFORMATION SAFE?
                </a>
              </li>
              <li>
                <a href="#infominors" className="text-emerald-400 hover:underline">
                  DO WE COLLECT INFORMATION FROM MINORS?
                </a>
              </li>
              <li>
                <a href="#privacyrights" className="text-emerald-400 hover:underline">
                  WHAT ARE YOUR PRIVACY RIGHTS?
                </a>
              </li>
              <li>
                <a href="#DNT" className="text-emerald-400 hover:underline">
                  CONTROLS FOR DO-NOT-TRACK FEATURES
                </a>
              </li>
              <li>
                <a href="#uslaws" className="text-emerald-400 hover:underline">
                  DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
                </a>
              </li>
              <li>
                <a href="#otherlaws" className="text-emerald-400 hover:underline">
                  DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
                </a>
              </li>
              <li>
                <a href="#policyupdates" className="text-emerald-400 hover:underline">
                  DO WE MAKE UPDATES TO THIS NOTICE?
                </a>
              </li>
              <li>
                <a href="#contact" className="text-emerald-400 hover:underline">
                  HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
                </a>
              </li>
              <li>
                <a href="#request" className="text-emerald-400 hover:underline">
                  HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
                </a>
              </li>
            </ol>

            <h2 id="infocollect" className="text-2xl font-bold text-white mt-8 mb-4">
              1. WHAT INFORMATION DO WE COLLECT?
            </h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">
              Personal information you disclose to us
            </h3>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We collect personal information that you provide to us.
            </p>

            <p>
              We collect personal information that you voluntarily provide to us when you register on the Services, express
              an interest in obtaining information about us or our products and Services, when you participate in
              activities on the Services, or otherwise when you contact us.
            </p>

            <p className="mt-4">
              <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on
              the context of your interactions with us and the Services, the choices you make, and the products and
              features you use. The personal information we collect may include the following:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>names</li>
              <li>email addresses</li>
              <li>passwords</li>
            </ul>

            <p className="mt-4">
              <strong>Sensitive Information.</strong> We do not process sensitive information.
            </p>

            <p className="mt-4">
              <strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make
              purchases, such as your payment instrument number, and the security code associated with your payment
              instrument. All payment data is handled and stored by{' '}
              <strong>Stripe</strong> and <strong>RevenueCat</strong>. You may find their privacy notice link(s) here:{' '}
              <a href="https://stripe.com/privacy" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                https://stripe.com/privacy
              </a>{' '}
              and{' '}
              <a href="https://www.revenuecat.com/privacy" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                https://www.revenuecat.com/privacy
              </a>
              .
            </p>

            <p className="mt-4">
              All personal information that you provide to us must be true, complete, and accurate, and you must notify
              us of any changes to such personal information.
            </p>

            <h2 id="infouse" className="text-2xl font-bold text-white mt-8 mb-4">
              2. HOW DO WE PROCESS YOUR INFORMATION?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We process your information to provide, improve, and administer our Services,
              communicate with you, for security and fraud prevention, and to comply with law. We process the personal
              information for the following purposes listed below. We may also process your information for other purposes
              only with your prior explicit consent.
            </p>

            <p className="mt-4">
              <strong>We process your personal information for a variety of reasons, depending on how you interact with
              our Services, including:</strong>
            </p>

            <ul className="list-disc pl-6 space-y-3 mt-4">
              <li>
                <strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We
                may process your information so you can create and log in to your account, as well as keep your account in
                working order.
              </li>
              <li>
                <strong>To deliver and facilitate delivery of services to the user.</strong> We may process your
                information to provide you with the requested service.
              </li>
              <li>
                <strong>To send administrative information to you.</strong> We may process your information to send you
                details about our products and services, changes to our terms and policies, and other similar
                information.
              </li>
              <li>
                <strong>To request feedback.</strong> We may process your information when necessary to request feedback
                and to contact you about your use of our Services.
              </li>
            </ul>

            <h2 id="legalbases" className="text-2xl font-bold text-white mt-8 mb-4">
              3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We only process your personal information when we believe it is necessary and we
              have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to
              comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to
              protect your rights, or to fulfill our legitimate business interests.
            </p>

            <p className="mt-4">
              <em>
                <strong>If you are located in the EU or UK, this section applies to you.</strong>
              </em>
            </p>

            <p>
              The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we
              rely on in order to process your personal information. As such, we may rely on the following legal bases to
              process your personal information:
            </p>

            <ul className="list-disc pl-6 space-y-3 mt-4">
              <li>
                <strong>Consent.</strong> We may process your information if you have given us permission (i.e., consent)
                to use your personal information for a specific purpose. You can withdraw your consent at any time.{' '}
                <a href="#contact" className="text-emerald-400 hover:underline">
                  Learn more
                </a>
                .
              </li>
              <li>
                <strong>Performance of a Contract.</strong> We may process your personal information when we believe it
                is necessary to fulfill our contractual obligations to you, including providing our Services or at your
                request prior to entering into a contract with you.
              </li>
              <li>
                <strong>Legitimate Interests.</strong> We may process your information when we believe it is reasonably
                necessary to achieve our legitimate business interests and those interests do not outweigh your
                interests and fundamental rights and freedoms. For example, we may process your personal information for
                some of the purposes described in order to:
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Identify usage trends</li>
                  <li>Request feedback</li>
                </ul>
              </li>
              <li>
                <strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for
                compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory
                agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in
                which we are involved.
              </li>
              <li>
                <strong>Vital Interests.</strong> We may process your information where we believe it is necessary to
                protect your vital interests or the vital interests of a third party, such as situations involving
                potential threats to the safety of any person.
              </li>
            </ul>

            <h2 id="whoshare" className="text-2xl font-bold text-white mt-8 mb-4">
              4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We may share information in specific situations described in this section and/or
              with the following third parties.
            </p>

            <p className="mt-4">
              We may need to share your personal information in the following situations:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or
                during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion
                of our business to another company.
              </li>
              <li>
                <strong>Affiliates.</strong> We may share your information with our affiliates, in which case we will
                require those affiliates to honor this Privacy Notice. Affiliates include our parent company and any
                subsidiaries, joint venture partners, or other companies that we control or that are under common control
                with us.
              </li>
            </ul>

            <p className="mt-6">
              We also may need to share your personal information in the following situations:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>AI Platforms</strong>
              </li>
              <li>
                <strong>Cloud Computing Services</strong>
              </li>
              <li>
                <strong>Invoicing and Billing</strong>
              </li>
            </ul>

            <h2 id="cookies" className="text-2xl font-bold text-white mt-8 mb-4">
              5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your
              information.
            </p>

            <p>
              We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information
              when you interact with our Services. Some online tracking technologies help us maintain the security of our
              Services, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
            </p>

            <p className="mt-4">
              We also permit third parties and service providers to use online tracking technologies on our Services for
              analytics and technical reasons. These third parties and service providers use their technology to provide
              you with analytics services. For specific information on how they collect and use your information, please
              refer to the privacy policies of the providers listed above.
            </p>

            <p className="mt-4">
              <strong>Google Analytics</strong>
            </p>

            <p>
              We do not use Google Analytics. The following information is provided for informational purposes only:
              Google Analytics is a web analytics service offered by Google that tracks and reports website traffic.
              Google uses the data collected to track and monitor the use of our Service. This data is shared with other
              Google services. Google may use the collected data to contextualize and personalize the ads of its own
              advertising network.
            </p>

            <p className="mt-4">
              You can opt-out of having made your activity on the Service available to Google Analytics by installing the
              Google Analytics opt-out browser add-on. The add-on prevents the Google Analytics JavaScript (ga.js,
              analytics.js, and dc.js) from sharing information with Google Analytics about visits activity.
            </p>

            <p className="mt-4">
              For more information on the privacy practices of Google, please visit the Google Privacy & Terms web page:{' '}
              <a href="https://policies.google.com/privacy" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                https://policies.google.com/privacy
              </a>
            </p>

            <h2 id="ai" className="text-2xl font-bold text-white mt-8 mb-4">
              6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We offer products, features, or tools powered by artificial intelligence,
              machine learning, or models.
            </p>

            <p>
              We offer products, features, or tools powered by artificial intelligence, machine learning, or models
              (collectively, "AI Products"). These AI Products are designed to enhance your experience and provide you
              with innovative solutions. The terms in this Privacy Notice govern your use of AI Products within our
              Services.
            </p>

            <p className="mt-4">
              <strong>Use of AI Technologies</strong>
            </p>

            <p>
              We use AI technologies, including from OpenAI, to provide our Services. The AI technologies are used for
              the following purposes:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Content generation</li>
              <li>Natural language processing and understanding</li>
              <li>Analysis and feedback</li>
            </ul>

            <h2 id="intltransfers" className="text-2xl font-bold text-white mt-8 mb-4">
              7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We may transfer, store, and process your information in countries other than
              your own.
            </p>

            <p>
              Our servers are located in the United States. If you are accessing our Services from outside the United
              States, please be aware that your information may be transferred to, stored, and processed by us in our
              facilities and by those third parties with whom we may share your personal information (see{' '}
              <a href="#whoshare" className="text-emerald-400 hover:underline">
                "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
              </a>{' '}
              above), in the United States, and other countries.
            </p>

            <p className="mt-4">
              If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these
              countries may not necessarily have data protection laws or other similar laws as comprehensive as those in
              your country. However, we will take all necessary measures to protect your personal information in
              accordance with this Privacy Notice and applicable law.
            </p>

            <p className="mt-4">
              <strong>European Commission's Standard Contractual Clauses:</strong>
            </p>

            <p>
              We have implemented measures to protect your personal information, including by using the European
              Commission's Standard Contractual Clauses for transfers of personal information between our group
              companies and between us and our third-party providers. These clauses require all recipients to protect
              all personal information they process originating from the EEA or UK in accordance with European data
              protection laws and regulations. Our Standard Contractual Clauses can be provided upon request. We have
              implemented similar appropriate safeguards with our third-party service providers and partners and further
              details can be provided upon request.
            </p>

            <h2 id="inforetain" className="text-2xl font-bold text-white mt-8 mb-4">
              8. HOW LONG DO WE KEEP YOUR INFORMATION?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes
              outlined in this Privacy Notice unless otherwise required by law.
            </p>

            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this
              Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting,
              or other legal requirements). No purpose in this notice will require us keeping your personal information
              for longer than{' '}
              <strong>twelve (12) months past the start of the idle period of the user's account</strong>.
            </p>

            <p className="mt-4">
              When we have no ongoing legitimate business need to process your personal information, we will either
              delete or anonymize such information, or, if this is not possible (for example, because your personal
              information has been stored in backup archives), then we will securely store your personal information
              and isolate it from any further processing until deletion is possible.
            </p>

            <h2 id="infosafe" className="text-2xl font-bold text-white mt-8 mb-4">
              9. HOW DO WE KEEP YOUR INFORMATION SAFE?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We aim to protect your personal information through a system of organizational
              and technical security measures.
            </p>

            <p>
              We have implemented appropriate and reasonable technical and organizational security measures designed to
              protect the security of any personal information we process. However, despite our safeguards and efforts
              to secure your information, no electronic transmission over the Internet or information storage
              technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers,
              cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly
              collect, access, steal, or modify your information. Although we will do our best to protect your personal
              information, transmission of personal information to and from our Services is at your own risk. You
              should only access the Services within a secure environment.
            </p>

            <h2 id="infominors" className="text-2xl font-bold text-white mt-8 mb-4">
              10. DO WE COLLECT INFORMATION FROM MINORS?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of
              age.
            </p>

            <p>
              We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we
              knowingly sell such personal information. By using the Services, you represent that you are at least 18 or
              that you are the parent or guardian of such a minor and consent to such minor dependent's use of the
              Services. If we learn that personal information from users less than 18 years of age has been collected,
              we will deactivate the account and take reasonable measures to promptly delete such data from our records.
              If you become aware of any data we may have collected from children under age 18, please contact us at{' '}
              <a href="mailto:ntadic1804@icloud.com" className="text-emerald-400 hover:underline">
                ntadic1804@icloud.com
              </a>
              .
            </p>

            <h2 id="privacyrights" className="text-2xl font-bold text-white mt-8 mb-4">
              11. WHAT ARE YOUR PRIVACY RIGHTS?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> Depending on your state of residence in the US or in some regions, such as the
              EEA, UK, Switzerland, and Canada, you have rights that allow you greater access to and control over your
              personal information. You may review, change, or terminate your account at any time, depending on your
              country, province, or state of residence.
            </p>

            <p className="mt-4">
              In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data
              protection laws. These may include the right (i) to request access and obtain a copy of your personal
              information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal
              information; (iv) if applicable, to data portability; and (v) not to be subject to automated
              decision-making. In certain circumstances, you may also have the right to object to the processing of your
              personal information. You can make such a request by contacting us by using the contact details provided
              in the section{' '}
              <a href="#contact" className="text-emerald-400 hover:underline">
                "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"
              </a>{' '}
              below.
            </p>

            <p className="mt-4">
              We will consider and act upon any request in accordance with applicable data protection laws.
            </p>

            <p className="mt-4">
              If you are located in the EEA or UK and you believe we are unlawfully processing your personal information,
              you also have the right to complain to your{' '}
              <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Member State data protection authority
              </a>{' '}
              or{' '}
              <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                UK data protection authority
              </a>
              .
            </p>

            <p className="mt-4">
              If you are located in Switzerland, you may contact the{' '}
              <a href="https://www.edoeb.admin.ch/edoeb/en/home.html" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Federal Data Protection and Information Commissioner
              </a>
              .
            </p>

            <p className="mt-4">
              <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal
              information, which may be express and/or implied consent depending on the applicable law, you have the
              right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by
              using the contact details provided in the section{' '}
              <a href="#contact" className="text-emerald-400 hover:underline">
                "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"
              </a>{' '}
              below.
            </p>

            <p className="mt-4">
              However, please note that this will not affect the lawfulness of the processing before its withdrawal nor,
              when applicable law allows, will it affect the processing of your personal information conducted in reliance
              on lawful processing grounds other than consent.
            </p>

            <p className="mt-4">
              <strong>Opting out of marketing and promotional communications:</strong> You can unsubscribe from our
              marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that
              we send, or by contacting us using the details provided in the section{' '}
              <a href="#contact" className="text-emerald-400 hover:underline">
                "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"
              </a>{' '}
              below. You will then be removed from the marketing lists. However, we may still communicate with you — for
              example, to send you service-related messages that are necessary for the administration and use of your
              account, to respond to service requests, or for other non-marketing purposes.
            </p>

            <p className="mt-4">
              <strong>Account Information</strong>
            </p>

            <p>
              If you would at any time like to review or change the information in your account or terminate your
              account, you can:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Log in to your account settings and update your user account.</li>
            </ul>

            <p className="mt-4">
              Upon your request to terminate your account, we will deactivate or delete your account and information from
              our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot
              problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal
              requirements.
            </p>

            <p className="mt-4">
              <strong>Cookies and similar technologies:</strong> Most Web browsers are set to accept cookies by default.
              If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you
              choose to remove cookies or reject cookies, this could affect certain features or services of our Services.
            </p>

            <p className="mt-4">
              If you have questions or comments about your privacy rights, you may email us at{' '}
              <a href="mailto:ntadic1804@icloud.com" className="text-emerald-400 hover:underline">
                ntadic1804@icloud.com
              </a>
              .
            </p>

            <h2 id="DNT" className="text-2xl font-bold text-white mt-8 mb-4">
              12. CONTROLS FOR DO-NOT-TRACK FEATURES
            </h2>

            <p>
              Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT")
              feature or setting you can activate to signal your privacy preference not to have data about your online
              browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing
              and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser
              signals or any other mechanism that automatically communicates your choice not to be tracked online. If a
              standard for online tracking is adopted that we must follow in the future, we will inform you about that
              practice in a revised version of this Privacy Notice.
            </p>

            <h2 id="uslaws" className="text-2xl font-bold text-white mt-8 mb-4">
              13. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> If you are a resident of the United States, you are granted specific rights
              regarding access to your personal information.
            </p>

            <p className="mt-4">
              <strong>Categories of Personal Information We Collect</strong>
            </p>

            <p>
              We have collected the following categories of personal information in the past twelve (12) months:
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="font-semibold text-white">Category A: Identifiers</p>
                <p>
                  Examples: Contact details, such as real name, alias, postal address, telephone or mobile contact number,
                  unique personal identifier, online identifier, Internet Protocol address, email address, and account
                  name
                </p>
                <p>
                  <strong>Collected: Yes</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category B: Personal information as defined in the California Customer Records statute</p>
                <p>
                  Examples: Name, contact information, education, employment, employment history, and financial
                  information
                </p>
                <p>
                  <strong>Collected: Yes</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category C: Protected classification characteristics under state or federal law</p>
                <p>Examples: Gender and date of birth</p>
                <p>
                  <strong>Collected: No</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category D: Commercial information</p>
                <p>
                  Examples: Transaction information, purchase history, financial details, and payment information
                </p>
                <p>
                  <strong>Collected: Yes</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category E: Biometric information</p>
                <p>Examples: Fingerprints and voiceprints</p>
                <p>
                  <strong>Collected: No</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category F: Internet or other similar network activity</p>
                <p>
                  Examples: Browsing history, search history, online behavior, interest data, and interactions with our
                  and other websites, applications, systems, and advertisements
                </p>
                <p>
                  <strong>Collected: No</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category G: Geolocation data</p>
                <p>Examples: Device location</p>
                <p>
                  <strong>Collected: No</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category H: Audio, electronic, sensory, or visual information</p>
                <p>
                  Examples: Images and audio, video or call recordings created in connection with our business activities
                </p>
                <p>
                  <strong>Collected: Yes</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category I: Professional or employment-related information</p>
                <p>
                  Examples: Business contact details in order to provide you our Services at a business level or job
                  title, work history, and professional qualifications if you apply for a job with us
                </p>
                <p>
                  <strong>Collected: No</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category J: Education information</p>
                <p>Examples: Student records and directory information</p>
                <p>
                  <strong>Collected: No</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category K: Inferences drawn from personal information</p>
                <p>
                  Examples: Inferences drawn from any of the collected personal information listed above to create a
                  profile about, for example, an individual's preferences and characteristics
                </p>
                <p>
                  <strong>Collected: Yes</strong>
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">Category L: Sensitive personal information</p>
                <p>
                  <strong>Collected: No</strong>
                </p>
              </div>
            </div>

            <p className="mt-6">
              We may also collect other personal information outside of these categories through instances where you
              interact with us in person, online, or by phone or mail in the context of:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Receiving help through our customer support channels;</li>
              <li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
            </ul>

            <p className="mt-6">
              We will use and retain the collected personal information as needed to provide the Services or for:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                Category A – <strong>As long as the user has an account with us</strong>
              </li>
              <li>
                Category B – <strong>As long as the user has an account with us</strong>
              </li>
              <li>
                Category D – <strong>As long as the user has an account with us</strong>
              </li>
              <li>
                Category H – <strong>As long as the user has an account with us</strong>
              </li>
              <li>
                Category K – <strong>As long as the user has an account with us</strong>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Sources of Personal Information</h3>

            <p>
              Learn more about the sources of personal information we collect in{' '}
              <a href="#infocollect" className="text-emerald-400 hover:underline">
                "WHAT INFORMATION DO WE COLLECT?"
              </a>
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">How We Use and Share Personal Information</h3>

            <p>
              Learn more about how we use your personal information in the section,{' '}
              <a href="#infouse" className="text-emerald-400 hover:underline">
                "HOW DO WE PROCESS YOUR INFORMATION?"
              </a>
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Will your information be shared with anyone else?</h3>

            <p>
              We may disclose your personal information with our service providers pursuant to a written contract between
              us and each service provider. Learn more about how we disclose personal information to in the section,{' '}
              <a href="#whoshare" className="text-emerald-400 hover:underline">
                "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
              </a>
            </p>

            <p className="mt-4">
              We may use your personal information for our own business purposes, such as for undertaking internal
              research for technological development and demonstration. This is not considered to be "selling" of your
              personal information.
            </p>

            <p className="mt-4">
              We have not sold or shared any personal information to third parties for a business or commercial purpose in
              the preceding twelve (12) months. We have disclosed the following categories of personal information to
              third parties for a business or commercial purpose in the preceding twelve (12) months:
            </p>

            <p className="mt-4">
              The categories of third parties to whom we disclosed personal information for a business or commercial
              purpose can be found under{' '}
              <a href="#whoshare" className="text-emerald-400 hover:underline">
                "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
              </a>
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Your Rights</h3>

            <p>
              You have rights under certain US state data protection laws. However, these rights are not absolute, and
              in certain cases, we may decline your request as permitted by law. These rights include:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Right to know</strong> whether or not we are processing your personal data
              </li>
              <li>
                <strong>Right to access</strong> your personal data
              </li>
              <li>
                <strong>Right to correct</strong> inaccuracies in your personal data
              </li>
              <li>
                <strong>Right to request</strong> the deletion of your personal data
              </li>
              <li>
                <strong>Right to obtain a copy</strong> of the personal data you previously shared with us
              </li>
              <li>
                <strong>Right to non-discrimination</strong> for exercising your rights
              </li>
              <li>
                <strong>Right to opt out</strong> of the processing of your personal data if it is used for targeted
                advertising (or sharing as defined under California's privacy law), the sale of personal data, or
                profiling in furtherance of decisions that produce legal or similarly significant effects ("profiling")
              </li>
            </ul>

            <p className="mt-4">
              Depending upon the state where you live, you may also have the following rights:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                Right to access the categories of personal data being processed (as permitted by applicable law,
                including the privacy law in Minnesota)
              </li>
              <li>
                Right to obtain a list of the categories of third parties to which we have disclosed personal data (as
                permitted by applicable law, including the privacy law in California, Delaware, and Maryland)
              </li>
              <li>
                Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted
                by applicable law, including the privacy law in Minnesota and Oregon)
              </li>
              <li>
                Right to obtain a list of third parties to which we have sold personal data (as permitted by applicable
                law, including the privacy law in Connecticut)
              </li>
              <li>
                Right to review, understand, question, and depending on where you live, correct how personal data has
                been profiled (as permitted by applicable law, including the privacy law in Connecticut and Minnesota)
              </li>
              <li>
                Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including
                the privacy law in California)
              </li>
              <li>
                Right to opt out of the collection of sensitive data and personal data collected through the operation
                of a voice or facial recognition feature (as permitted by applicable law, including the privacy law in
                Florida)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">How to Exercise Your Rights</h3>

            <p>
              To exercise these rights, you can contact us by submitting a{' '}
              <a
                href="https://app.termly.io/dsar/6a27cae7-b1a8-43dd-baee-8490204568fb"
                className="text-emerald-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                data subject access request
              </a>
              , by emailing us at{' '}
              <a href="mailto:ntadic1804@icloud.com" className="text-emerald-400 hover:underline">
                ntadic1804@icloud.com
              </a>
              , or by referring to the contact details at the bottom of this document.
            </p>

            <p className="mt-4">
              Under certain US state data protection laws, you can designate an authorized agent to make a request on
              your behalf. We may deny a request from an authorized agent that does not submit proof that they have been
              validly authorized to act on your behalf in accordance with applicable laws.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Request Verification</h3>

            <p>
              Upon receiving your request, we will need to verify your identity to determine you are the same person
              about whom we have the information in our system. We will only use personal information provided in your
              request to verify your identity or authority to make the request. However, if we cannot verify your
              identity from the information already maintained by us, we may request that you provide additional
              information for the purposes of verifying your identity and for security or fraud-prevention purposes.
            </p>

            <p className="mt-4">
              If you submit the request through an authorized agent, we may need to collect additional information to
              verify your identity before processing your request and the agent will need to provide a written and signed
              permission from you to submit such request on your behalf.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Appeals</h3>

            <p>
              Under certain US state data protection laws, if we decline to take action regarding your request, you may
              appeal our decision by emailing us at{' '}
              <a href="mailto:ntadic1804@icloud.com" className="text-emerald-400 hover:underline">
                ntadic1804@icloud.com
              </a>
              . We will inform you in writing of any action taken or not taken in response to the appeal, including a
              written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint
              to your state attorney general.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">California "Shine The Light" Law</h3>

            <p>
              California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are
              California residents to request and obtain from us, once a year and free of charge, information about
              categories of personal information (if any) we disclosed to third parties for direct marketing purposes
              and the names and addresses of all third parties with which we shared personal information in the
              immediately preceding calendar year. If you are a California resident and would like to make such a request,
              please submit your request in writing to us by using the contact details provided in the section{' '}
              <a href="#contact" className="text-emerald-400 hover:underline">
                "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"
              </a>
            </p>

            <h2 id="otherlaws" className="text-2xl font-bold text-white mt-8 mb-4">
              14. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> You may have additional rights based on the country you reside in.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Australia and New Zealand</h3>

            <p>
              We collect and process your personal information under the obligations and conditions set by Australia's
              Privacy Act 1988 and New Zealand's Privacy Act 2020 (Privacy Act).
            </p>

            <p className="mt-4">
              This Privacy Notice satisfies the notice requirements defined in both Privacy Acts, in particular: what
              personal information we collect from you, from which sources, for which purposes, and other recipients of
              your personal information.
            </p>

            <p className="mt-4">
              If you do not wish to provide the personal information necessary to fulfill their applicable purpose, it
              may affect our ability to provide our services, in particular:
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>offer you the products or services that you want</li>
              <li>respond to or help with your requests</li>
              <li>manage your account with us</li>
              <li>confirm your identity and protect your account</li>
            </ul>

            <p className="mt-4">
              At any time, you have the right to request access to or correction of your personal information. You can
              make such a request by contacting us by using the contact details provided in the section{' '}
              <a href="#request" className="text-emerald-400 hover:underline">
                "HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?"
              </a>
            </p>

            <p className="mt-4">
              If you believe we are unlawfully processing your personal information, you have the right to submit a
              complaint about a breach of the Australian Privacy Principles to the{' '}
              <a href="https://www.oaic.gov.au/privacy/privacy-complaints/lodge-a-privacy-complaint-with-us" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Office of the Australian Information Commissioner
              </a>{' '}
              and a breach of New Zealand's Privacy Principles to the{' '}
              <a href="https://www.privacy.org.nz/your-rights/making-a-complaint/" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Office of New Zealand Privacy Commissioner
              </a>
              .
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Republic of South Africa</h3>

            <p>
              At any time, you have the right to request access to or correction of your personal information. You can
              make such a request by contacting us by using the contact details provided in the section{' '}
              <a href="#request" className="text-emerald-400 hover:underline">
                "HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?"
              </a>
            </p>

            <p className="mt-4">
              If you are unsatisfied with the manner in which we address any complaint with regard to our processing of
              personal information, you can contact the office of the regulator, the details of which are:
            </p>

            <p className="mt-2">
              <a href="https://inforegulator.org.za/" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                The Information Regulator (South Africa)
              </a>
            </p>

            <p>General enquiries:{' '}
              <a href="mailto:enquiries@inforegulator.org.za" className="text-emerald-400 hover:underline">
                enquiries@inforegulator.org.za
              </a>
            </p>

            <p>
              Complaints (complete POPIA/PAIA form 5):{' '}
              <a href="mailto:PAIAComplaints@inforegulator.org.za" className="text-emerald-400 hover:underline">
                PAIAComplaints@inforegulator.org.za
              </a>{' '}
              &{' '}
              <a href="mailto:POPIAComplaints@inforegulator.org.za" className="text-emerald-400 hover:underline">
                POPIAComplaints@inforegulator.org.za
              </a>
            </p>

            <h2 id="policyupdates" className="text-2xl font-bold text-white mt-8 mb-4">
              15. DO WE MAKE UPDATES TO THIS NOTICE?
            </h2>

            <p className="text-white/60 italic mb-4">
              <strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant
              laws.
            </p>

            <p>
              We may update this Privacy Notice from time to time. The updated version will be indicated by an updated
              "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we
              may notify you either by prominently posting a notice of such changes or by directly sending you a
              notification. We encourage you to review this Privacy Notice frequently to be informed of how we are
              protecting your information.
            </p>

            <h2 id="contact" className="text-2xl font-bold text-white mt-8 mb-4">
              16. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </h2>

            <p>
              If you have questions or comments about this notice, you may email us at{' '}
              <a href="mailto:ntadic1804@icloud.com" className="text-emerald-400 hover:underline">
                ntadic1804@icloud.com
              </a>{' '}
              or contact us by post at:
            </p>

            <div className="mt-4 space-y-1">
              <p className="font-semibold text-white">Niko Tadic</p>
              <p>Ulica Stjepana Gradica 13</p>
              <p>Zagreb, Grad Zagreb 10010</p>
              <p>Croatia</p>
            </div>

            <h2 id="request" className="text-2xl font-bold text-white mt-8 mb-4">
              17. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
            </h2>

            <p>
              Based on the applicable laws of your country or state of residence in the US, you may have the right to
              request access to the personal information we collect from you, details about how we have processed it,
              correct inaccuracies, or delete your personal information. You may also have the right to withdraw your
              consent to our processing of your personal information. These rights may be limited in some circumstances
              by applicable law. To request to review, update, or delete your personal information, please fill out and
              submit a{' '}
              <a
                href="https://app.termly.io/dsar/6a27cae7-b1a8-43dd-baee-8490204568fb"
                className="text-emerald-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                data subject access request
              </a>
              .
            </p>

            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-white/60 text-sm">
                This Privacy Policy was created using Termly's{' '}
                <a
                  href="https://termly.io/products/privacy-policy-generator/"
                  className="text-emerald-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy Generator
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
