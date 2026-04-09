export class Enums{

    public static userType = [
        {label: 'Admin' ,value: 'ADMIN'},
        {label: 'Organizador' ,value: 'ORGANIZADOR'}
    ];

    public static userStatus = [
        {label: 'Ativo' ,value: 'ATIVO'},
        {label: 'Inativo' ,value: 'INATIVO'}
    ];

    public static topicPriority = [
        {label: 'Baixa' ,value: 'BAIXA'},
        {label: 'Média' ,value: 'MEDIA'},
        {label: 'Alta' , value: 'ALTA'}
    ];

    public static participantRole = [
        {label: 'Organizador' ,value: 'ORGANIZADOR'},
        {label: 'Participante' ,value: 'PARTICIPANTE'},
        {label: 'Palestrante' , value: 'PALESTRANTE'}
    ];

    public static participantParticipation = [
        {label: 'Não participou' ,value: 'NAO_PARTICIPOU'},
        {label: 'Participou' ,value: 'PARTICIPOU'},
        {label: 'Sim' , value: 'SIM'},
        {label: 'Não' , value: 'NAO'},
        {label: 'Talvez' , value: 'TALVEZ'}
    ];

    public static meetingStatus = [
        {label: 'Não iniciado' ,value: 'NAO_INCIADO'},
        {label: 'Em andamento' ,value: 'EM_ANDAMENTO'},
        {label: 'Concluído' , value: 'CONCLUIDO'}
    ];


}