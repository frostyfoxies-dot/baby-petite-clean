/**
 * Registry Invitation Email Template
 *
 * Sent when a user shares their baby registry with friends/family.
 */

import * as React from 'react';
import {
  EmailLayout,
  EmailContainer,
  EmailHeader,
  EmailSection,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailFooter,
  Spacer,
  brandColors,
} from './components';
import { emailConfig } from '../config';

export interface RegistryInviteProps {
  inviterName: string;
  registryName: string;
  registryUrl: string;
  eventDate?: Date;
  message?: string;
  supportEmail?: string;
}

export function RegistryInviteEmail({
  inviterName,
  registryName,
  registryUrl,
  eventDate,
  message,
  supportEmail = emailConfig.supportEmail,
}: RegistryInviteProps) {
  const formattedDate = eventDate?.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <EmailLayout preview={`${inviterName} has created a baby registry for you!`}>
      <EmailHeader>
        <EmailHeading style={{ color: brandColors.primary }}>
          🎁 You're Invited to a Baby Registry!
        </EmailHeading>
        <EmailText>
          <strong>{inviterName}</strong> has created a baby registry on Kids Petite and would like to share it with you.
        </EmailText>
      </EmailHeader>

      <EmailContainer>
        <EmailSection align="center" style={{ padding: '20px 0' }}>
          <EmailText style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            {registryName}
          </EmailText>
          {formattedDate && (
            <EmailText style={{ color: '#666', marginBottom: '16px' }}>
              Event Date: {formattedDate}
            </EmailText>
          )}
          <EmailButton
            href={registryUrl}
            style={{
              backgroundColor: brandColors.primary,
              color: '#fff',
              padding: '12px 32px',
              fontSize: '16px',
            }}
          >
            View Registry
          </EmailButton>
        </EmailSection>

        {message && (
          <>
            <Spacer height={24} />
            <Divider />
            <Spacer height={24} />
            <EmailSection>
              <EmailText
                style={{
                  fontStyle: 'italic',
                  color: '#555',
                  fontSize: '15px',
                  lineHeight: '1.6',
                }}
              >
                "{message}"
              </EmailText>
              <Spacer height={12} />
              <EmailText style={{ color: '#888' }}>
                — {inviterName}
              </EmailText>
            </EmailSection>
          </>
        )}

        <Spacer height={24} />
        <Divider />

        <EmailSection>
          <EmailText style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <strong>What's a baby registry?</strong>
            <br />
            A baby registry helps expecting parents create a curated list of items they need for their little one. It makes gift-giving easy for friends and family, ensuring everyone gets something useful and special.
            <br />
            <br />
            You can browse the registry and purchase items directly. The registry owner will see what's been purchased to avoid duplicates, and they'll receive a thank-you message with your name (unless you choose to stay anonymous).
          </EmailText>
        </EmailSection>

        <Spacer height={20} />
        <EmailSection align="center">
          <EmailText style={{ fontSize: '12px', color: '#999' }}>
            Questions? Contact us at {supportEmail}
          </EmailText>
        </EmailSection>
      </EmailContainer>

      <EmailFooter>
        <EmailText style={{ fontSize: '12px', color: '#999' }}>
          © {new Date().getFullYear()} Kids Petite. All rights reserved.
        </EmailText>
      </EmailFooter>
    </EmailLayout>
  );
}
