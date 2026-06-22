export type GdprLegalSection = {
  heading: string;
  body: string;
};

export type GdprLegalPageContent = {
  locale: 'pt-PT';
  title: string;
  lastUpdated: string;
  sections: GdprLegalSection[];
};

export const termosContent: GdprLegalPageContent = {
  locale: 'pt-PT',
  title: 'Termos de Utilização',
  lastUpdated: '2026-06-22',
  sections: [
    {
      heading: '1. Identificação do Serviço',
      body: 'O Pic4Paws é uma plataforma digital que liga associações de animais, adotantes e padrinhos, disponibilizada por Pic4Paws Lda., com sede em Portugal. Ao aceder ou utilizar a plataforma, o utilizador aceita os presentes Termos de Utilização na sua totalidade.',
    },
    {
      heading: '2. Condições de Acesso e Conta',
      body: 'O acesso a determinadas funcionalidades requer o registo de uma conta pessoal. O utilizador compromete-se a fornecer informações verdadeiras e atualizadas e a manter a confidencialidade das suas credenciais. A conta é pessoal e intransmissível.',
    },
    {
      heading: '3. Obrigações do Utilizador',
      body: 'O utilizador obriga-se a utilizar a plataforma de forma lícita, não podendo publicar conteúdos ofensivos, enganosos ou que violem direitos de terceiros. É proibido o uso da plataforma para fins comerciais não autorizados, spam ou atividades ilegais ao abrigo da legislação portuguesa e europeia.',
    },
    {
      heading: '4. Conteúdo Publicado',
      body: 'O utilizador é responsável pelo conteúdo que publica, incluindo fotografias e descrições de animais. A plataforma reserva-se o direito de remover conteúdo que viole estes Termos ou que seja considerado prejudicial para a comunidade.',
    },
    {
      heading: '5. Propriedade Intelectual',
      body: 'Todos os elementos da plataforma — logótipos, design, código e documentação — são propriedade de Pic4Paws Lda. ou dos seus licenciantes. É proibida a reprodução ou distribuição sem autorização expressa e escrita.',
    },
    {
      heading: '6. Proteção de Dados Pessoais',
      body: 'O tratamento de dados pessoais é realizado em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD / UE 2016/679) e demais legislação aplicável. Para mais informações, consulte a nossa Política de Privacidade em /privacidade.',
    },
    {
      heading: '7. Limitação de Responsabilidade',
      body: 'A Pic4Paws Lda. não assume responsabilidade por danos indiretos resultantes da utilização da plataforma, incluindo a indisponibilidade temporária do serviço. A plataforma é disponibilizada "tal como está", sem garantias de continuidade.',
    },
    {
      heading: '8. Alterações aos Termos',
      body: 'Estes Termos podem ser revistos periodicamente. As alterações substanciais serão comunicadas com pelo menos 15 dias de antecedência através do endereço de correio eletrónico associado à conta. A continuação da utilização após a entrada em vigor das alterações constitui aceitação das mesmas.',
    },
    {
      heading: '9. Lei Aplicável e Jurisdição',
      body: 'Os presentes Termos de Utilização regem-se pela lei portuguesa. Quaisquer litígios serão submetidos à jurisdição dos tribunais competentes do distrito de Lisboa, sem prejuízo da aplicação das normas imperativas de proteção ao consumidor.',
    },
    {
      heading: '10. Contacto',
      body: 'Para questões relativas a estes Termos, contacte-nos através de suporte@pic4paws.pt.',
    },
  ],
};

export const privacidadeContent: GdprLegalPageContent = {
  locale: 'pt-PT',
  title: 'Política de Privacidade',
  lastUpdated: '2026-06-22',
  sections: [
    {
      heading: '1. Responsável pelo Tratamento',
      body: 'O responsável pelo tratamento dos seus dados pessoais é a Pic4Paws Lda., com sede em Portugal. Para contactar o responsável pelo tratamento: privacidade@pic4paws.pt.',
    },
    {
      heading: '2. Dados Pessoais Recolhidos',
      body: 'Recolhemos os seguintes dados necessários para a prestação do serviço: endereço de correio eletrónico, nome a apresentar, preferências de notificação e, para abrigos, informações de contacto da organização. Não recolhemos dados desnecessários para além do estritamente necessário para cada finalidade.',
    },
    {
      heading: '3. Finalidade e Base Jurídica do Tratamento',
      body: 'Os dados são tratados para as seguintes finalidades: (a) execução do contrato de prestação de serviços — base jurídica: execução de contrato (Art. 6.º, n.º 1, al. b) do RGPD); (b) cumprimento de obrigações legais — base jurídica: obrigação legal (Art. 6.º, n.º 1, al. c)); (c) comunicações de serviço e notificações — base jurídica: consentimento (Art. 6.º, n.º 1, al. a)) que pode ser retirado a qualquer momento.',
    },
    {
      heading: '4. Prazo de Conservação dos Dados',
      body: 'Os dados são conservados durante o período em que a conta se mantiver ativa e, após o seu encerramento, pelo prazo legalmente exigido ou pelo período necessário para cumprimento de obrigações contratuais ou legais — no máximo cinco anos, salvo obrigação legal em contrário.',
    },
    {
      heading: '5. Destinatários dos Dados',
      body: 'Os dados pessoais não são vendidos nem cedidos a terceiros para fins comerciais. Podem ser partilhados com prestadores de serviços subcontratados (p. ex., infraestrutura cloud) que atuam como subcontratantes e estão vinculados por acordos de proteção de dados compatíveis com o RGPD.',
    },
    {
      heading: '6. Transferências Internacionais',
      body: 'Sempre que os dados sejam transferidos para países fora do Espaço Económico Europeu, asseguramos a existência de garantias adequadas nos termos do RGPD (nomeadamente cláusulas contratuais-tipo aprovadas pela Comissão Europeia).',
    },
    {
      heading: '7. Direitos dos Titulares dos Dados',
      body: 'Nos termos do RGPD, tem direito a: aceder aos seus dados, retificá-los, apagá-los, opor-se ao tratamento, solicitar a limitação do tratamento e exercer o direito à portabilidade. Para exercer estes direitos, contacte privacidade@pic4paws.pt. Tem ainda o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD) em www.cnpd.pt.',
    },
    {
      heading: '8. Segurança dos Dados',
      body: 'Adotamos medidas técnicas e organizativas adequadas para proteger os seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição, incluindo encriptação em trânsito e em repouso.',
    },
    {
      heading: '9. Alterações a Esta Política',
      body: 'Esta Política de Privacidade pode ser atualizada. Em caso de alterações substanciais, notificaremos os utilizadores pelo menos 15 dias antes da entrada em vigor das alterações. A data da última revisão encontra-se indicada no topo desta página.',
    },
    {
      heading: '10. Contacto',
      body: 'Para questões relativas à proteção de dados pessoais, contacte-nos através de privacidade@pic4paws.pt.',
    },
  ],
};
