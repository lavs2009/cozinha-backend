 -- CUIDADO: Isso apaga todo o banco atual!
DROP DATABASE IF EXISTS cantina;
CREATE DATABASE cantina;

-- Tabela de Cozinheiras
CREATE TABLE public.cozinheira (
	id_usuario SERIAL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	senha VARCHAR(255) NOT NULL,
	CONSTRAINT cozinheira_email_unique UNIQUE (email)
);

-- Tabela de Pratos (com campo imagem)
CREATE TABLE public.prato (
	id_prato SERIAL PRIMARY KEY,
	dia DATE NOT NULL,
	turno VARCHAR(50) NOT NULL,
	principal VARCHAR(255) NOT NULL,
	sobremesa VARCHAR(255) NOT NULL,
	bebida VARCHAR(255) NOT NULL,
	imagem VARCHAR(255),
	id_usuario INT NOT NULL,
	CONSTRAINT prato_usuario_fk FOREIGN KEY (id_usuario) REFERENCES cozinheira(id_usuario)
);


-- Tabela de Votação
CREATE TABLE public.votacao (
	id_voto SERIAL PRIMARY KEY,
	id_prato INT NOT NULL,
	voto BOOLEAN NOT NULL,
	data_voto DATE NOT NULL,
	ip_usuario INET NOT NULL,
	CONSTRAINT votacao_prato_fk FOREIGN KEY (id_prato) REFERENCES prato(id_prato),
	-- Um IP só pode votar uma vez por prato:
	CONSTRAINT votacao_unico_ip_prato UNIQUE (ip_usuario, id_prato)
);