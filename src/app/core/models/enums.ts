export class Enums {

  static userType = [
    { label: 'Admin',        value: 'ADMIN'        },
    { label: 'Organizador',  value: 'ORGANIZADOR'  },
    { label: 'Participante', value: 'PARTICIPANTE' },
  ];

  static userStatus = [
    { label: 'Ativo',   value: 'ATIVO'   },
    { label: 'Inativo', value: 'INATIVO' },
  ];

  static meetingStatus = [
    { label: 'Não iniciado',  value: 'NAO_INICIADO'  },
    { label: 'Em andamento',  value: 'EM_ANDAMENTO'  },
    { label: 'Concluído',     value: 'CONCLUIDO'     },
  ];

  static topicPriority = [
    { label: 'Alta',  value: 'ALTA'  },
    { label: 'Média', value: 'MEDIA' },
    { label: 'Baixa', value: 'BAIXA' },
  ];

  static participantRole = [
    { label: 'Organizador',  value: 'ORGANIZADOR'  },
    { label: 'Participante', value: 'PARTICIPANTE' },
    { label: 'Palestrante',  value: 'PALESTRANTE'  },
  ];

  static participantParticipation = [
    { label: 'Não participou', value: 'NAO_PARTICIPOU' },
    { label: 'Participou',     value: 'PARTICIPOU'     },
    { label: 'Sim',            value: 'SIM'            },
    { label: 'Não',            value: 'NAO'            },
    { label: 'Talvez',         value: 'TALVEZ'         },
  ];
}
