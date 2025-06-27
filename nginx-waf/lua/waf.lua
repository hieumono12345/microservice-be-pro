-- waf.lua

local function contains_sql_injection(input)
    if not input then return false end
    local sql_patterns = {
        [[\bunion\b.*\bselect\b]],
        [[\bselect\b.*\bfrom\b]],
        [[\binsert\b.*\binto\b]],
        [[\bdelete\b.*\bfrom\b]],
        [[\bupdate\b.*\bset\b]],
        [[\bexec\b]],
        [[\bexecute\b]],
        [[\bdeclare\b]],
        [[\bcast\b]],
        [[\bconvert\b]]
    }

    for _, pattern in ipairs(sql_patterns) do
        local from, _, err = ngx.re.find(input, pattern, "ijo")
        if from then return true end
    end
    return false
end

local function contains_xss(input)
    if not input then return false end
    local xss_patterns = {
        [[<script\b]],
        [[</script>]],
        [[\bjavascript:]],
        [[on\w+\s*=]],
        [[\beval\s*\(]],
        [[\bexpression\s*\(]]
    }

    for _, pattern in ipairs(xss_patterns) do
        local from, _, err = ngx.re.find(input, pattern, "ijo")
        if from then return true end
    end
    return false
end

-- Escape chuỗi JSON để tránh lỗi khi có dấu " hoặc xuống dòng
local function escape_json(str)
    if not str then return "" end
    str = ngx.re.gsub(str, [[\\]], [[\\\\]], "jo")
    str = ngx.re.gsub(str, [["]], [[\\"]], "jo")
    str = ngx.re.gsub(str, [[\n]], [[\\n]], "jo")
    return str
end

local function log_attack(attack_type, uri, args, body)
    local log = string.format(
        '{"timestamp":"%s","type":"%s","uri":"%s","args":"%s","body":"%s"}',
        ngx.utctime(),
        attack_type,
        escape_json(uri),
        escape_json(args),
        escape_json(body)
    )
    ngx.log(ngx.ERR, log)
end

local function check_request()
    local uri = ngx.var.uri
    local args = ngx.var.args or ""
    ngx.req.read_body()
    local body = ngx.req.get_body_data() or ""

    -- Bỏ qua kiểm tra cho các endpoint an toàn
    local whitelist = {
        ["/auth/login"] = true,
        ["/auth/refresh"] = true,
        ["/auth/signup"] = true
    }
    if whitelist[uri] then return end

    -- Kiểm tra SQL Injection
    if contains_sql_injection(uri) or contains_sql_injection(args) or contains_sql_injection(body) then
        log_attack("SQLI", uri, args, body)
        ngx.status = 403
        ngx.say("Forbidden: SQL Injection Detected")
        return ngx.exit(403)
    end

    -- Kiểm tra XSS
    if contains_xss(uri) or contains_xss(args) or contains_xss(body) then
        log_attack("XSS", uri, args, body)
        ngx.status = 403
        ngx.say("Forbidden: XSS Attack Detected")
        return ngx.exit(403)
    end
end

check_request()
