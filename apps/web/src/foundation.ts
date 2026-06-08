import { webMediaUploadContent, type WebMediaUploadContent } from './media-upload';
import {
  webPetMediaUploadUiContent,
  type WebPetMediaUploadUiContent,
} from './pet-media-upload';
import { webPetPublishUiContent, type WebPetPublishUiContent } from './pet-publish';
import { webPetDraftUiContent, type WebPetDraftUiContent } from './pet-draft';
import {
  webPetDraftSaveFlowUiContent,
  type WebPetDraftSaveFlowUiContent,
} from './pet-draft-save-flow';
import { webPetFeedUiContent, type WebPetFeedUiContent } from './pet-feed';
import { webPetProfileUiContent, type WebPetProfileUiContent } from './pet-profile';
import { webShelterProfileUiContent, type WebShelterProfileUiContent } from './shelter-profile';
import { webAdoptionUiContent, type WebAdoptionUiContent } from './adoption';
import { webAdoptionListUiContent, type WebAdoptionListUiContent } from './adoption-list';
import { webDonationUiContent, type WebDonationUiContent } from './donation';
import { webDonationListUiContent, type WebDonationListUiContent } from './donation-list';
import { webDonationStatusUiContent, type WebDonationStatusUiContent } from './donation-status';
import { webSponsorshipUiContent, type WebSponsorshipUiContent } from './sponsorship';
import {
  webSponsorshipListUiContent,
  type WebSponsorshipListUiContent,
} from './sponsorship-list';
import {
  webSponsorshipManageUiContent,
  type WebSponsorshipManageUiContent,
} from './sponsorship-manage';
import {
  webSponsorshipDonorListUiContent,
  type WebSponsorshipDonorListUiContent,
} from './sponsorship-donor-list';
import {
  webAdoptionStatusUiContent,
  type WebAdoptionStatusUiContent,
} from './adoption-status';
import {
  webAdoptionViewUiContent,
  type WebAdoptionViewUiContent,
} from './adoption-view';
import {
  webShelterMemberUiContent,
  type WebShelterMemberUiContent,
} from './shelter-member';
import { webPetArchiveUiContent, type WebPetArchiveUiContent } from './pet-archive';

export type WebFoundationStatus = 'contract-ready';

export type WebFoundationContent = {
  locale: 'pt-PT';
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  primaryAction: {
    label: string;
    href: string | null;
  };
  mediaUpload: Pick<WebMediaUploadContent, 'title' | 'description' | 'status'>;
  petDraft: Pick<WebPetDraftUiContent, 'title' | 'description' | 'status'>;
  petMediaUpload: Pick<WebPetMediaUploadUiContent, 'title' | 'description' | 'status'>;
  petPublish: Pick<WebPetPublishUiContent, 'title' | 'description' | 'status'>;
  petDraftSaveFlow: Pick<WebPetDraftSaveFlowUiContent, 'title' | 'description' | 'status'>;
  petFeed: Pick<WebPetFeedUiContent, 'title' | 'description' | 'status'>;
  petProfile: Pick<WebPetProfileUiContent, 'title' | 'description' | 'status'>;
  shelterProfile: Pick<WebShelterProfileUiContent, 'title' | 'description' | 'status'>;
  adoptionApplication: Pick<WebAdoptionUiContent, 'title' | 'description' | 'status'>;
  adoptionList: Pick<WebAdoptionListUiContent, 'title' | 'description' | 'status'>;
  donation: Pick<WebDonationUiContent, 'title' | 'description' | 'status'>;
  donationList: Pick<WebDonationListUiContent, 'title' | 'description' | 'status'>;
  donationStatus: Pick<WebDonationStatusUiContent, 'title' | 'description' | 'status'>;
  sponsorship: Pick<WebSponsorshipUiContent, 'title' | 'description' | 'status'>;
  sponsorshipList: Pick<WebSponsorshipListUiContent, 'title' | 'description' | 'status'>;
  sponsorshipManage: Pick<WebSponsorshipManageUiContent, 'title' | 'description' | 'status'>;
  sponsorshipDonorList: Pick<WebSponsorshipDonorListUiContent, 'title' | 'description' | 'status'>;
  adoptionStatus: Pick<WebAdoptionStatusUiContent, 'title' | 'description' | 'status'>;
  adoptionView: Pick<WebAdoptionViewUiContent, 'title' | 'description' | 'status'>;
  shelterMember: Pick<WebShelterMemberUiContent, 'title' | 'description' | 'status'>;
  petArchive: Pick<WebPetArchiveUiContent, 'title' | 'description' | 'status'>;
  readiness: Array<{
    id: 'database' | 'auth' | 'pets' | 'payments' | 'media' | 'workers';
    label: string;
    description: string;
    status: WebFoundationStatus;
  }>;
};

export const webFoundationContent: WebFoundationContent = {
  locale: 'pt-PT',
  hero: {
    eyebrow: 'Fundação Pic4Paws V2',
    title: 'Pic4Paws',
    body:
      'Plataforma portuguesa para ligar associações, adotantes e padrinhos através de perfis de animais, adoções, donativos e operações de abrigo com privacidade desde o início.',
  },
  primaryAction: {
    label: 'Fundação técnica em curso',
    href: null,
  },
  mediaUpload: {
    title: webMediaUploadContent.title,
    description: webMediaUploadContent.description,
    status: webMediaUploadContent.status,
  },
  petDraft: {
    title: webPetDraftUiContent.title,
    description: webPetDraftUiContent.description,
    status: webPetDraftUiContent.status,
  },
  petMediaUpload: {
    title: webPetMediaUploadUiContent.title,
    description: webPetMediaUploadUiContent.description,
    status: webPetMediaUploadUiContent.status,
  },
  petPublish: {
    title: webPetPublishUiContent.title,
    description: webPetPublishUiContent.description,
    status: webPetPublishUiContent.status,
  },
  petDraftSaveFlow: {
    title: webPetDraftSaveFlowUiContent.title,
    description: webPetDraftSaveFlowUiContent.description,
    status: webPetDraftSaveFlowUiContent.status,
  },
  petFeed: {
    title: webPetFeedUiContent.title,
    description: webPetFeedUiContent.description,
    status: webPetFeedUiContent.status,
  },
  petProfile: {
    title: webPetProfileUiContent.title,
    description: webPetProfileUiContent.description,
    status: webPetProfileUiContent.status,
  },
  shelterProfile: {
    title: webShelterProfileUiContent.title,
    description: webShelterProfileUiContent.description,
    status: webShelterProfileUiContent.status,
  },
  adoptionApplication: {
    title: webAdoptionUiContent.title,
    description: webAdoptionUiContent.description,
    status: webAdoptionUiContent.status,
  },
  adoptionList: {
    title: webAdoptionListUiContent.title,
    description: webAdoptionListUiContent.description,
    status: webAdoptionListUiContent.status,
  },
  donation: {
    title: webDonationUiContent.title,
    description: webDonationUiContent.description,
    status: webDonationUiContent.status,
  },
  donationList: {
    title: webDonationListUiContent.title,
    description: webDonationListUiContent.description,
    status: webDonationListUiContent.status,
  },
  donationStatus: {
    title: webDonationStatusUiContent.title,
    description: webDonationStatusUiContent.description,
    status: webDonationStatusUiContent.status,
  },
  sponsorship: {
    title: webSponsorshipUiContent.title,
    description: webSponsorshipUiContent.description,
    status: webSponsorshipUiContent.status,
  },
  sponsorshipList: {
    title: webSponsorshipListUiContent.title,
    description: webSponsorshipListUiContent.description,
    status: webSponsorshipListUiContent.status,
  },
  sponsorshipManage: {
    title: webSponsorshipManageUiContent.title,
    description: webSponsorshipManageUiContent.description,
    status: webSponsorshipManageUiContent.status,
  },
  sponsorshipDonorList: {
    title: webSponsorshipDonorListUiContent.title,
    description: webSponsorshipDonorListUiContent.description,
    status: webSponsorshipDonorListUiContent.status,
  },
  adoptionStatus: {
    title: webAdoptionStatusUiContent.title,
    description: webAdoptionStatusUiContent.description,
    status: webAdoptionStatusUiContent.status,
  },
  adoptionView: {
    title: webAdoptionViewUiContent.title,
    description: webAdoptionViewUiContent.description,
    status: webAdoptionViewUiContent.status,
  },
  shelterMember: {
    title: webShelterMemberUiContent.title,
    description: webShelterMemberUiContent.description,
    status: webShelterMemberUiContent.status,
  },
  petArchive: {
    title: webPetArchiveUiContent.title,
    description: webPetArchiveUiContent.description,
    status: webPetArchiveUiContent.status,
  },
  readiness: [
    {
      id: 'database',
      label: 'Base de dados e RLS',
      description: 'Contratos Drizzle e políticas SQL preparadas para revisão antes de migrations reais.',
      status: 'contract-ready',
    },
    {
      id: 'auth',
      label: 'Autorização',
      description: 'Regras partilhadas para admins, membros de abrigos e adotantes.',
      status: 'contract-ready',
    },
    {
      id: 'pets',
      label: 'Animais',
      description: 'Lifecycle de rascunho para publicado com abrigo verificado e imagem pública.',
      status: 'contract-ready',
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      description: 'Transações em cêntimos e webhooks idempotentes sem confiar no cliente.',
      status: 'contract-ready',
    },
    {
      id: 'media',
      label: 'Media',
      description: 'Políticas para imagens públicas e documentos privados antes de R2 real.',
      status: 'contract-ready',
    },
    {
      id: 'workers',
      label: 'Workers',
      description: 'Boundaries de ambiente, health check e webhooks preparados para adapters.',
      status: 'contract-ready',
    },
  ],
};
