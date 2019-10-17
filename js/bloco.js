class Bloco{
    constructor(params){
        if (params === undefined) params = {
            nome:"", disponibilidade:0, mttf:0, mttr:0, doc:""
        };
        
        this.nome=params.nome;
        this.disponibilidade=params.disponibilidade;
        this.mttf=params.mttf;
        this.mttr=params.mttr;        
        //let b = doc.createElement('bloco');
        //b.setAttribute('nome', this.nome);
        //b.setAttribute('disponibilidade', this.disponibilidade);
        //return b;
    }

    setNome(nome){
        this.nome=nome;
    }

    getNome(){
        return this.nome;
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