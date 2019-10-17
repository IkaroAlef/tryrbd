class Bloco{
    constructor(nome, disponibilidade, mttf, mttr, doc){
        this.mttf=mttf;
        this.mttr=mttr;
        this.nome=nome;
        this.disponibilidade=disponibilidade;
        let b = doc.createElement('bloco');
        b.setAttribute('nome', nome);
        b.setAttribute('disponibilidade', disponibilidade);
        return b;
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