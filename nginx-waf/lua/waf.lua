local function contains_sql_injection(input)
    local sql_patterns = {
        "union.*select",
        "select.*from",
        "insert.*into",
        "delete.*from",
        "update.*set",
        "exec",
        "execute",
        "declare",
        "cast",
        "convert"
    }
    for _, pattern in ipairs(sql_patterns) do
        if input and input:lower():find(pattern) then
            return true
        end
    end
    return false
end

local function contains_xss(input)
    local xss_patterns = {
        "<script",
        "</script",
        "javascript",
        "on\\w+\\s*=",
        "eval",
        "expression"
    }
    for _, pattern in ipairs(xss_patterns) do
        if input and input:lower():find(pattern) then
            return true
        end
    end
    return false
end

local function check_request()
    local uri = ngx.var.uri
    local args = ngx.var.args or ""
    ngx.req.read_body()
    local body = ngx.req.get_body_data() or ""

    -- Logging để debug
    ngx.log(ngx.DEBUG, "URI: ", uri)
    ngx.log(ngx.DEBUG, "Args: ", args)
    ngx.log(ngx.DEBUG, "Body: ", body)

    if contains_sql_injection(uri) or contains_sql_injection(args) or contains_sql_injection(body) then
        local timestamp = ngx.localtime()
        local attack_log = string.format("[%s] SQL Injection Detected - URI: %s, Args: %s, Body: %s", timestamp, uri, args, body)
        ngx.log(ngx.INFO, attack_log)
        ngx.status = 403
        ngx.say("Forbidden: SQL Injection Detected")
        return ngx.exit(403)
    end

    if contains_xss(uri) or contains_xss(args) or contains_xss(body) then
        local timestamp = ngx.localtime()
        local attack_log = string.format("[%s] XSS Attack Detected - URI: %s, Args: %s, Body: %s", timestamp, uri, args, body)
        ngx.log(ngx.INFO, attack_log)
        ngx.status = 403
        ngx.say("Forbidden: XSS Attack Detected")
        return ngx.exit(403)
    end
end

check_request()