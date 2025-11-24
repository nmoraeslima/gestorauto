-- ============================================================================
-- LIMPEZA: Remover empresas de teste que falharam no signup
-- ============================================================================

-- Ver empresas sem usuários associados (cadastros incompletos)
SELECT 
    c.id,
    c.name,
    c.slug,
    c.email,
    c.created_at,
    COUNT(p.id) as num_users
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GROUP BY c.id, c.name, c.slug, c.email, c.created_at
HAVING COUNT(p.id) = 0
ORDER BY c.created_at DESC;

-- ============================================================================
-- ATENÇÃO: Execute o SELECT acima primeiro para ver quais empresas serão deletadas
-- Se estiver tudo certo, descomente e execute o DELETE abaixo:
-- ============================================================================

-- Deletar empresas sem usuários (cadastros que falharam)
-- DELETE FROM companies
-- WHERE id IN (
--     SELECT c.id
--     FROM companies c
--     LEFT JOIN profiles p ON p.company_id = c.id
--     GROUP BY c.id
--     HAVING COUNT(p.id) = 0
-- );

-- ============================================================================
-- Depois de executar, tente cadastrar novamente com o mesmo slug
-- ============================================================================
