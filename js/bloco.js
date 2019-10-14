class Bloco{
    constructor(nome, disponibilidade, mttf, mttr){
        this.mttf=mttf;
        this.mttr=mttr;
        this.nome=nome;
        this.disponibilidade=disponibilidade;
    }

    setNome(nome){
        this.nome=nome;
    }

    setMttf(mttf){
        this.mettf=mttf;
    }

    setMttr(mttr){
        this.Mttr=mttr;
    }

    setDisponibilidade(disponibilidade){
        this.disponibilidade=disponibilidade;
    }
}