import { productName } from '@pic4paws/domain';
import { mobileMediaUploadContent, type MobileMediaUploadContent } from './media-upload';
import {
  mobilePetMediaUploadUiContent,
  type MobilePetMediaUploadUiContent,
} from './pet-media-upload';
import {
  mobilePetPublishUiContent,
  type MobilePetPublishUiContent,
} from './pet-publish';
import {
  mobilePetDraftUiContent,
  type MobilePetDraftUiContent,
} from './pet-draft';
import {
  mobilePetDraftSaveFlowUiContent,
  type MobilePetDraftSaveFlowUiContent,
} from './pet-draft-save-flow';
import { mobilePetFeedUiContent, type MobilePetFeedUiContent } from './pet-feed';
import { mobilePetProfileUiContent, type MobilePetProfileUiContent } from './pet-profile';
import {
  mobileShelterProfileUiContent,
  type MobileShelterProfileUiContent,
} from './shelter-profile';
import { mobileAdoptionUiContent, type MobileAdoptionUiContent } from './adoption';
import {
  mobileAdoptionListUiContent,
  type MobileAdoptionListUiContent,
} from './adoption-list';
import { mobileDonationUiContent, type MobileDonationUiContent } from './donation';
import {
  mobileDonationListUiContent,
  type MobileDonationListUiContent,
} from './donation-list';
import {
  mobileDonationStatusUiContent,
  type MobileDonationStatusUiContent,
} from './donation-status';
import {
  mobileSponsorshipUiContent,
  type MobileSponsorshipUiContent,
} from './sponsorship';
import {
  mobileSponsorshipListUiContent,
  type MobileSponsorshipListUiContent,
} from './sponsorship-list';
import {
  mobileSponsorshipDonorListUiContent,
  type MobileSponsorshipDonorListUiContent,
} from './sponsorship-donor-list';
import {
  mobileSponsorshipManageUiContent,
  type MobileSponsorshipManageUiContent,
} from './sponsorship-manage';
import {
  mobileAdoptionStatusUiContent,
  type MobileAdoptionStatusUiContent,
} from './adoption-status';
import {
  mobileAdoptionViewUiContent,
  type MobileAdoptionViewUiContent,
} from './adoption-view';
import {
  mobileShelterMemberUiContent,
  type MobileShelterMemberUiContent,
} from './shelter-member';
import { mobilePetArchiveUiContent, type MobilePetArchiveUiContent } from './pet-archive';
import {
  mobileNotificationUiContent,
  type MobileNotificationUiContent,
} from './notification';
import {
  mobileAdoptionDonorListUiContent,
  type MobileAdoptionDonorListUiContent,
} from './adoption-donor-list';

export type MobileFoundationStatus = 'contract-ready';

export type MobileFoundationContent = {
  locale: 'pt-PT';
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  primaryAction: {
    label: string;
    route: string | null;
  };
  mediaUpload: Pick<MobileMediaUploadContent, 'title' | 'description' | 'status'>;
  petDraft: Pick<MobilePetDraftUiContent, 'title' | 'description' | 'status'>;
  petMediaUpload: Pick<MobilePetMediaUploadUiContent, 'title' | 'description' | 'status'>;
  petPublish: Pick<MobilePetPublishUiContent, 'title' | 'description' | 'status'>;
  petDraftSaveFlow: Pick<MobilePetDraftSaveFlowUiContent, 'title' | 'description' | 'status'>;
  petFeed: Pick<MobilePetFeedUiContent, 'title' | 'description' | 'status'>;
  petProfile: Pick<MobilePetProfileUiContent, 'title' | 'description' | 'status'>;
  shelterProfile: Pick<MobileShelterProfileUiContent, 'title' | 'description' | 'status'>;
  adoptionApplication: Pick<MobileAdoptionUiContent, 'title' | 'description' | 'status'>;
  adoptionList: Pick<MobileAdoptionListUiContent, 'title' | 'description' | 'status'>;
  donation: Pick<MobileDonationUiContent, 'title' | 'description' | 'status'>;
  donationList: Pick<MobileDonationListUiContent, 'title' | 'description' | 'status'>;
  donationStatus: Pick<MobileDonationStatusUiContent, 'title' | 'description' | 'status'>;
  sponsorship: Pick<MobileSponsorshipUiContent, 'title' | 'description' | 'status'>;
  sponsorshipList: Pick<MobileSponsorshipListUiContent, 'title' | 'description' | 'status'>;
  sponsorshipManage: Pick<MobileSponsorshipManageUiContent, 'title' | 'description' | 'status'>;
  sponsorshipDonorList: Pick<MobileSponsorshipDonorListUiContent, 'title' | 'description' | 'status'>;
  adoptionStatus: Pick<MobileAdoptionStatusUiContent, 'title' | 'description' | 'status'>;
  adoptionView: Pick<MobileAdoptionViewUiContent, 'title' | 'description' | 'status'>;
  shelterMember: Pick<MobileShelterMemberUiContent, 'title' | 'description' | 'status'>;
  petArchive: Pick<MobilePetArchiveUiContent, 'title' | 'description' | 'status'>;
  notification: Pick<MobileNotificationUiContent, 'title' | 'description' | 'status'>;
  adoptionDonorList: Pick<MobileAdoptionDonorListUiContent, 'title' | 'description' | 'status'>;
  readiness: Array<{
    id: 'database' | 'auth' | 'pets' | 'payments' | 'media' | 'workers';
    label: string;
    description: string;
    status: MobileFoundationStatus;
  }>;
};

export const mobileFoundationContent: MobileFoundationContent = {
  locale: 'pt-PT',
  hero: {
    eyebrow: 'Fundação mobile Pic4Paws V2',
    title: productName,
    body:
      'Experiência mobile portuguesa para ligar associações, adotantes e padrinhos através de perfis de animais, adoções, donativos e operações de abrigo com privacidade desde o início.',
  },
  primaryAction: {
    label: 'Fundação técnica em curso',
    route: null,
  },
  mediaUpload: {
    title: mobileMediaUploadContent.title,
    description: mobileMediaUploadContent.description,
    status: mobileMediaUploadContent.status,
  },
  petDraft: {
    title: mobilePetDraftUiContent.title,
    description: mobilePetDraftUiContent.description,
    status: mobilePetDraftUiContent.status,
  },
  petMediaUpload: {
    title: mobilePetMediaUploadUiContent.title,
    description: mobilePetMediaUploadUiContent.description,
    status: mobilePetMediaUploadUiContent.status,
  },
  petPublish: {
    title: mobilePetPublishUiContent.title,
    description: mobilePetPublishUiContent.description,
    status: mobilePetPublishUiContent.status,
  },
  petDraftSaveFlow: {
    title: mobilePetDraftSaveFlowUiContent.title,
    description: mobilePetDraftSaveFlowUiContent.description,
    status: mobilePetDraftSaveFlowUiContent.status,
  },
  petFeed: {
    title: mobilePetFeedUiContent.title,
    description: mobilePetFeedUiContent.description,
    status: mobilePetFeedUiContent.status,
  },
  petProfile: {
    title: mobilePetProfileUiContent.title,
    description: mobilePetProfileUiContent.description,
    status: mobilePetProfileUiContent.status,
  },
  shelterProfile: {
    title: mobileShelterProfileUiContent.title,
    description: mobileShelterProfileUiContent.description,
    status: mobileShelterProfileUiContent.status,
  },
  adoptionApplication: {
    title: mobileAdoptionUiContent.title,
    description: mobileAdoptionUiContent.description,
    status: mobileAdoptionUiContent.status,
  },
  adoptionList: {
    title: mobileAdoptionListUiContent.title,
    description: mobileAdoptionListUiContent.description,
    status: mobileAdoptionListUiContent.status,
  },
  donation: {
    title: mobileDonationUiContent.title,
    description: mobileDonationUiContent.description,
    status: mobileDonationUiContent.status,
  },
  donationList: {
    title: mobileDonationListUiContent.title,
    description: mobileDonationListUiContent.description,
    status: mobileDonationListUiContent.status,
  },
  donationStatus: {
    title: mobileDonationStatusUiContent.title,
    description: mobileDonationStatusUiContent.description,
    status: mobileDonationStatusUiContent.status,
  },
  sponsorship: {
    title: mobileSponsorshipUiContent.title,
    description: mobileSponsorshipUiContent.description,
    status: mobileSponsorshipUiContent.status,
  },
  sponsorshipList: {
    title: mobileSponsorshipListUiContent.title,
    description: mobileSponsorshipListUiContent.description,
    status: mobileSponsorshipListUiContent.status,
  },
  sponsorshipManage: {
    title: mobileSponsorshipManageUiContent.title,
    description: mobileSponsorshipManageUiContent.description,
    status: mobileSponsorshipManageUiContent.status,
  },
  sponsorshipDonorList: {
    title: mobileSponsorshipDonorListUiContent.title,
    description: mobileSponsorshipDonorListUiContent.description,
    status: mobileSponsorshipDonorListUiContent.status,
  },
  adoptionStatus: {
    title: mobileAdoptionStatusUiContent.title,
    description: mobileAdoptionStatusUiContent.description,
    status: mobileAdoptionStatusUiContent.status,
  },
  adoptionView: {
    title: mobileAdoptionViewUiContent.title,
    description: mobileAdoptionViewUiContent.description,
    status: mobileAdoptionViewUiContent.status,
  },
  shelterMember: {
    title: mobileShelterMemberUiContent.title,
    description: mobileShelterMemberUiContent.description,
    status: mobileShelterMemberUiContent.status,
  },
  petArchive: {
    title: mobilePetArchiveUiContent.title,
    description: mobilePetArchiveUiContent.description,
    status: mobilePetArchiveUiContent.status,
  },
  notification: {
    title: mobileNotificationUiContent.title,
    description: mobileNotificationUiContent.description,
    status: mobileNotificationUiContent.status,
  },
  adoptionDonorList: {
    title: mobileAdoptionDonorListUiContent.title,
    description: mobileAdoptionDonorListUiContent.description,
    status: mobileAdoptionDonorListUiContent.status,
  },
  readiness: [
    {
      id: 'database',
      label: 'Base de dados e RLS',
      description: 'Contratos Drizzle e políticas SQL preparados antes de migrations reais.',
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
