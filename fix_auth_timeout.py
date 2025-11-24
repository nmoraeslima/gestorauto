import re

# Ler o arquivo
with open(r'c:\Natan\Antigravity\gestorauto\src\contexts\AuthContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Mudar timeout de 8000 para 30000
content = content.replace(
    "setTimeout(() => reject(new Error('Database timeout')), 8000)",
    "setTimeout(() => reject(new Error('Database timeout')), 30000)"
)

# 2. Comentar o bloco de logout forçado (linhas 117-121)
# Procurar e comentar o bloco específico
old_block = """                if (error.message === 'Database timeout') {
                    console.warn('Database timeout, forcing local cleanup');
                    void supabase.auth.signOut();
                    setSession(null);
                }"""

new_block = """                // REMOVIDO: Não força mais logout por timeout
                // if (error.message === 'Database timeout') {
                //     console.warn('Database timeout, forcing local cleanup');
                //     void supabase.auth.signOut();
                //     setSession(null);
                // }"""

content = content.replace(old_block, new_block)

# 3. Aumentar timeout de inicialização de 5000 para 20000
content = content.replace(
    "setTimeout(() => reject(new Error('Auth timeout')), 5000)",
    "setTimeout(() => reject(new Error('Auth timeout')), 20000)"
)

# 4. Comentar logout forçado na inicialização
old_init_block = """                if (error instanceof Error && error.message === 'Auth timeout') {
                    console.warn('Auth initialization timed out, forcing local cleanup');
                    void supabase.auth.signOut();
                    if (mounted) {
                        setSession(null);
                        setUser(null);
                    }
                }"""

new_init_block = """                // REMOVIDO: Não força mais logout por timeout na inicialização
                // if (error instanceof Error && error.message === 'Auth timeout') {
                //     console.warn('Auth initialization timed out, forcing local cleanup');
                //     void supabase.auth.signOut();
                //     if (mounted) {
                //         setSession(null);
                //         setUser(null);
                //     }
                // }"""

content = content.replace(old_init_block, new_init_block)

# Salvar o arquivo
with open(r'c:\Natan\Antigravity\gestorauto\src\contexts\AuthContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Arquivo atualizado com sucesso!")
print("Mudanças:")
print("1. Timeout de database: 8s → 30s")
print("2. Timeout de inicialização: 5s → 20s")
print("3. Logout automático por timeout: DESABILITADO")
